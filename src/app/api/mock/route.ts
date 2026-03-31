import { NextResponse } from 'next/server';
import { TournamentService } from '@/lib/services/tournament-service';

export async function GET() {
  try {
    const mockTournament = {
      name: "Copa Antigravity 2024",
      description: "Torneo de prueba con 8 participantes.",
      type: "single_elimination" as const
    };

    const participants = [
      "Team Alpha", "Team Beta", "Sigma Squad", "Gamma Rangers",
      "Delta Force", "Epsilon Eagles", "Zeta Knights", "Theta Titans"
    ].map(name => ({ name, logo_url: null }));

    const tournament = await TournamentService.createTournament(mockTournament, participants);

    return NextResponse.json({
        message: "Mock tournament created successfully",
        tournamentId: tournament.id,
        url: `/tournaments/${tournament.id}`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
