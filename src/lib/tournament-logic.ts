/**
 * Tournament Engine Utilities
 * Supports Single Elimination with Natural Seeding (1v2, 3v4, etc.)
 */

export interface Participant {
  id: string;
  name: string;
  seed: number;
}

export interface MatchStub {
  id?: string;
  round_number: number;
  participant_a_id: string | null;
  participant_b_id: string | null;
}

/**
 * Calculates the required number of rounds for N participants.
 */
export function calculateRounds(participantCount: number): number {
  return Math.ceil(Math.log2(participantCount));
}

/**
 * Returns the next power of two >= n.
 */
export function getNextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}

/**
 * Organizes participants in natural sequential order (sorted by seed ascending).
 * This produces matchups of 1v2, 3v4, 5v6, etc.
 * Byes (null slots) are added at the end if the count isn't a power of 2.
 */
export function organizeParticipantsNaturally(participants: Participant[]): (Participant | null)[] {
  const size = getNextPowerOfTwo(participants.length);
  // Sort by seed ascending
  const sorted = [...participants].sort((a, b) => a.seed - b.seed);
  
  // Pad with nulls (Byes) at the end
  const result: (Participant | null)[] = [...sorted];
  while (result.length < size) {
    result.push(null);
  }
  return result;
}

/**
 * Generates the initial match structure for a single elimination tournament.
 * Uses natural seeding: participants are matched in sequential order.
 * 
 * For 4 participants:
 *   Round 1: Match 1 (P1 vs P2), Match 2 (P3 vs P4)
 *   Round 2 (Final): Match 3 (Winner1 vs Winner2)
 * 
 * Returns an array of rounds, each containing an array of MatchStubs.
 */
export function generateInitialMatches(participants: Participant[]) {
  const size = getNextPowerOfTwo(participants.length);
  const totalRounds = calculateRounds(size);
  const organized = organizeParticipantsNaturally(participants);

  const matchesByRound: MatchStub[][] = [];

  // Round 1: pair participants sequentially (natural order)
  const round1: MatchStub[] = [];
  for (let i = 0; i < organized.length; i += 2) {
    const pA = organized[i];
    const pB = organized[i + 1];
    round1.push({
      round_number: 1,
      participant_a_id: pA?.id ?? null,
      participant_b_id: pB?.id ?? null,
    });
  }
  matchesByRound.push(round1);

  // Subsequent rounds (empty slots waiting for winners)
  let currentCount = round1.length;
  for (let r = 2; r <= totalRounds; r++) {
    currentCount = Math.ceil(currentCount / 2);
    const nextRound: MatchStub[] = [];
    for (let i = 0; i < currentCount; i++) {
      nextRound.push({
        round_number: r,
        participant_a_id: null,
        participant_b_id: null,
      });
    }
    matchesByRound.push(nextRound);
  }

  return matchesByRound;
}

/**
 * Given the current match's position index within its round,
 * determines whether the winner occupies slot A or B in the next match.
 * Even-indexed matches (0, 2, 4...) → slot A
 * Odd-indexed matches  (1, 3, 5...) → slot B
 */
export function getPositionInNextMatch(currentMatchIndex: number): 'A' | 'B' {
  return currentMatchIndex % 2 === 0 ? 'A' : 'B';
}
