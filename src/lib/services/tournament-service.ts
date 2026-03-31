import { createClient } from '@/lib/supabase/server';
import { generateInitialMatches, Participant } from '@/lib/tournament-logic';
import { Database } from '@/types/database.types';

type TournamentInsert = Database['public']['Tables']['tournaments']['Insert'];

export const TournamentService = {
  /**
   * Creates a tournament and its full initial match structure.
   */
  async createTournament(
    data: TournamentInsert,
    participantsRaw: { name: string, logo_url: string | null }[]
  ) {
    const supabase = await createClient();

    // 1. Insert Tournament
    const { data: tournament, error: tError } = await supabase
      .from('tournaments')
      .insert(data)
      .select()
      .single();

    if (tError) throw tError;

    // 2. Insert Participants with sequential seeds matching entry order
    const participantsData = participantsRaw.map((p, index) => ({
      tournament_id: tournament.id,
      name: p.name,
      logo_url: p.logo_url,
      seed: index + 1, // seed 1 = first placed, natural order
    }));

    const { data: participants, error: pError } = await supabase
      .from('participants')
      .insert(participantsData)
      .select();

    if (pError) throw pError;
    if (!participants || participants.length === 0) {
      throw new Error('No participants were created.');
    }

    // 3. Generate rounds and matches in memory using natural seeding
    const matchesByRound = generateInitialMatches(participants as Participant[]);

    // 4. Create Rounds in DB
    const roundIds: string[] = [];
    for (let i = 0; i < matchesByRound.length; i++) {
      const { data: round, error: rError } = await supabase
        .from('rounds')
        .insert({
          tournament_id: tournament.id,
          round_number: i + 1,
        })
        .select()
        .single();

      if (rError) throw rError;
      roundIds.push(round.id);
    }

    // 5. Create Matches sequentially to guarantee stable created_at ordering
    const createdMatchesByRound: any[][] = [];
    for (let r = 0; r < matchesByRound.length; r++) {
      const dbMatches: any[] = [];
      for (const m of matchesByRound[r]) {
        const { data: dbMatch, error: mError } = await supabase
          .from('matches')
          .insert({
            tournament_id: tournament.id,
            round_id: roundIds[r],
            participant_a_id: m.participant_a_id,
            participant_b_id: m.participant_b_id,
            status: 'pending' as const,
          })
          .select()
          .single();

        if (mError) throw mError;
        dbMatches.push(dbMatch);
      }
      createdMatchesByRound.push(dbMatches);
    }

    // 6. Link matches to their next match (next_match_id)
    for (let r = 0; r < createdMatchesByRound.length - 1; r++) {
      const currentRound = createdMatchesByRound[r];
      const nextRound = createdMatchesByRound[r + 1];

      for (let i = 0; i < currentRound.length; i++) {
        const nextMatchIndex = Math.floor(i / 2);
        if (nextRound[nextMatchIndex]) {
          await supabase
            .from('matches')
            .update({ next_match_id: nextRound[nextMatchIndex].id })
            .eq('id', currentRound[i].id);
        }
      }
    }

    return tournament;
  },

  async getTournamentDetails(id: string) {
    const supabase = await createClient();

    const { data: tournament } = await supabase
      .from('tournaments')
      .select(`
        *,
        participants (*),
        rounds (
          *,
          matches (
            *,
            participant_a:participants!participant_a_id(*),
            participant_b:participants!participant_b_id(*)
          )
        )
      `)
      .eq('id', id)
      .single();

    return tournament;
  }
};
