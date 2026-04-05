import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Verify Admin Auth
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

    // 2. Fetch match details to identify the winner to remove from next match
    const { data: match, error: mError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single();

    if (mError) throw mError;
    if (!match) throw new Error('Match not found');

    const winnerIdToReset = match.winner_id;

    // 3. Reset the current match
    const { error: resetError } = await supabase
      .from('matches')
      .update({
        winner_id: null,
        status: 'pending',
        score_a: 0,
        score_b: 0,
        box_score: null
      })
      .eq('id', id);

    if (resetError) throw resetError;

    // 4. Clean up next match if the winner had advanced
    if (match.next_match_id && winnerIdToReset) {
        const { data: nextMatch } = await supabase
            .from('matches')
            .select('participant_a_id, participant_b_id')
            .eq('id', match.next_match_id)
            .single();

        if (nextMatch) {
            const updates: any = {};
            if (nextMatch.participant_a_id === winnerIdToReset) {
                updates.participant_a_id = null;
            } else if (nextMatch.participant_b_id === winnerIdToReset) {
                updates.participant_b_id = null;
            }

            if (Object.keys(updates).length > 0) {
                await supabase
                    .from('matches')
                    .update(updates)
                    .eq('id', match.next_match_id);
            }
        }
    }

    // 5. Revert tournament status if it was completed
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('status')
        .eq('id', match.tournament_id)
        .single();

    if (tournament?.status === 'completed') {
        await supabase
            .from('tournaments')
            .update({ status: 'in_progress' })
            .eq('id', match.tournament_id);
    }

    // 6. Refresh UI
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Match Reset Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
