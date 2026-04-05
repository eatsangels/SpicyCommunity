import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { disqualifiedId } = await request.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 1. Obtener detalles del match actual
    const { data: match, error: mError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (mError) throw mError;

    // 2. Determinar quién es el ganador o si es doble descalificación
    let winnerId = null;
    let isDoubleDq = disqualifiedId === 'both';

    if (isDoubleDq) {
        winnerId = null;
    } else if (match.participant_a_id === disqualifiedId) {
        winnerId = match.participant_b_id;
    } else if (match.participant_b_id === disqualifiedId) {
        winnerId = match.participant_a_id;
    }

    if (!isDoubleDq && !winnerId) {
        return NextResponse.json({ error: 'Could not determine winner from disqualification' }, { status: 400 });
    }

    // 3. Actualizar el match actual
    // Seteamos el marcador a 0 para descalificados
    const { error: uError } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        disqualified_id: isDoubleDq ? null : disqualifiedId,
        is_double_dq: isDoubleDq,
        status: 'completed',
        score_a: (isDoubleDq || match.participant_a_id === disqualifiedId) ? 0 : Math.max(match.score_a || 0, 1),
        score_b: (isDoubleDq || match.participant_b_id === disqualifiedId) ? 0 : Math.max(match.score_b || 0, 1),
      })
      .eq('id', id);

    if (uError) throw uError;

    // 4. Si hay un siguiente match, avanzar al ganador (o limpiar si es Double DQ)
    if (match.next_match_id) {
        const { data: siblings } = await supabase
            .from('matches')
            .select('id')
            .eq('next_match_id', match.next_match_id)
            .order('created_at', { ascending: true });
        
        const currentIndex = siblings?.findIndex(m => m.id === id) ?? 0;
        const position = currentIndex % 2 === 0 ? 'A' : 'B';

        const updates: any = {};
        if (position === 'A') {
            updates.participant_a_id = winnerId;
        } else {
            updates.participant_b_id = winnerId;
        }

        // Si es Double DQ, también debemos asegurarnos de que el match siguiente no tenga ya un ganador de una descalificación previa
        if (isDoubleDq) {
            updates.winner_id = null;
            updates.status = 'pending';
        }

        await supabase
            .from('matches')
            .update(updates)
            .eq('id', match.next_match_id);
    } else {
        // Es el partido final
        if (isDoubleDq) {
            // El torneo termina sin campeón oficial o queda en espera
             await supabase
                .from('tournaments')
                .update({ status: 'completed' })
                .eq('id', match.tournament_id);
        } else if (winnerId) {
            await supabase
                .from('tournaments')
                .update({ status: 'completed' })
                .eq('id', match.tournament_id);
        }
    }

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Disqualification Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
