import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPositionInNextMatch } from '@/lib/tournament-logic';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { winnerId, score_a, score_b } = await request.json();
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

    // 2. Actualizar el match actual como completado y con ganador
    const { error: uError } = await supabase
      .from('matches')
      .update({
        winner_id: winnerId,
        status: 'completed',
        score_a: score_a ?? match.score_a,
        score_b: score_b ?? match.score_b,
      })
      .eq('id', id);

    if (uError) throw uError;

    // 3. Si hay un siguiente match y hay un ganador válido, avanzar
    if (match.next_match_id && winnerId) {
        // Fetch sibling matches for stable sorting
        const { data: siblings } = await supabase
            .from('matches')
            .select('id')
            .eq('next_match_id', match.next_match_id)
            .order('created_at', { ascending: true });
        
        const currentIndex = siblings?.findIndex(m => m.id === id) ?? 0;
        const position = currentIndex % 2 === 0 ? 'A' : 'B';

        // Fetch target match to check for existing duplicates
        const { data: nextMatch } = await supabase
            .from('matches')
            .select('participant_a_id, participant_b_id')
            .eq('id', match.next_match_id)
            .single();

        const updates: any = {};
        if (position === 'A') {
            updates.participant_a_id = winnerId;
            // Si el mismo ganador estaba en B (residuo de error previo), limpiar B
            if (nextMatch?.participant_b_id === winnerId) {
                updates.participant_b_id = null;
            }
        } else {
            updates.participant_b_id = winnerId;
            // Si el mismo ganador estaba en A (residuo de error previo), limpiar A
            if (nextMatch?.participant_a_id === winnerId) {
                updates.participant_a_id = null;
            }
        }

        await supabase
            .from('matches')
            .update(updates)
            .eq('id', match.next_match_id);
    } else if (!match.next_match_id && winnerId) {
        // Es el partido final del torneo, marcar torneo como completado
        await supabase
            .from('tournaments')
            .update({ status: 'completed' })
            .eq('id', match.tournament_id);
    }

    // Limpia la cache entera para que RSC vea el cambio
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Winner Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
