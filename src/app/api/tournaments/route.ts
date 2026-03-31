import { NextResponse } from 'next/server';
import { TournamentService } from '@/lib/services/tournament-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, type, participants } = body;

    // Parsing participantes (por coma o salto de línea)
    const participantsList = participants
      .split(/[\n,]+/)
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    if (participantsList.length < 2) {
      return NextResponse.json({ error: 'At least 2 participants required' }, { status: 400 });
    }

    const tournament = await TournamentService.createTournament({
      name,
      description,
      type
    }, participantsList);

    return NextResponse.json(tournament);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
