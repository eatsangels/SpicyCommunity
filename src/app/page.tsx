import HomeClient from "@/components/home/HomeClient";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Spicy Community | The Ultimate Tournament Arena",
  description: "Join the most competitive community for gaming tournaments. Real-time brackets, eSports management, and live arena updates. Built for champions.",
  openGraph: {
    title: "Spicy Community | eSports Tournament Management",
    description: "Manage your tournaments with the most advanced bracket engine in the community.",
    images: ["/logo_new.png"],
  },
  twitter: {
    title: "Spicy Community | eSports Arena",
    description: "The ultimate tournament experience starts here.",
    images: ["/logo_new.png"],
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // ── Fetch all data in parallel on the server ──────────────────────────────
  const [teamsResult, liveResult, scheduledResult] = await Promise.all([
    supabase
      .from('participants')
      .select('id, name, logo_url, created_at, tournaments(name)')
      .order('created_at', { ascending: false })
      .limit(12),

    supabase
      .from('tournaments')
      .select(`
        id, name, status, scheduled_at,
        participants (id, name, logo_url),
        rounds (
          id, round_number,
          matches (
            id, status,
            score_a, score_b,
            participant_a:participants!participant_a_id(id, name, logo_url),
            participant_b:participants!participant_b_id(id, name, logo_url)
          )
        )
      `)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false }),

    supabase
      .from('tournaments')
      .select('*, participants(id, name), tournament_likes(user_id)')
      .eq('status', 'scheduled')
      .gte('scheduled_at', now)
      .order('scheduled_at', { ascending: true }),
  ]);

  let liveTournaments = liveResult.data || [];

  // Fallback: if no in_progress, show most recent non-completed scheduled tournament
  if (liveTournaments.length === 0) {
    const { data: fallback } = await supabase
      .from('tournaments')
      .select(`
        id, name, status, scheduled_at,
        participants (id, name, logo_url),
        rounds (
          id, round_number,
          matches (
            id, status, score_a, score_b,
            participant_a:participants!participant_a_id(id, name, logo_url),
            participant_b:participants!participant_b_id(id, name, logo_url)
          )
        )
      `)
      .neq('status', 'completed')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: false })
      .limit(1);
    if (fallback) liveTournaments = fallback;
  }

  return (
    <HomeClient
      initialData={{
        recentTeams: teamsResult.data || [],
        liveTournaments,
        scheduledTournaments: scheduledResult.data || [],
      }}
    />
  );
}
