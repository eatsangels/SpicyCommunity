import { TournamentService } from "@/lib/services/tournament-service";
import BracketView from "@/components/tournament/BracketView";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const tournament = await TournamentService.getTournamentDetails(id);
  
  if (!tournament) return {};

  const title = `${tournament.name} | Spicy Community`;
  const description = `Follow the ${tournament.name} tournament on Spicy Community. Live brackets, real-time results, and community updates.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: "/og_banner.png", // Use the master banner for elite look
          width: 1200,
          height: 630,
          alt: `${tournament.name} | Spicy Community`,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og_banner.png"],
    },
  };
}

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await TournamentService.getTournamentDetails(id);

  if (!tournament) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    isAdmin = profile?.role === 'admin';
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pt-24">
      <BracketView tournament={tournament} isAdmin={isAdmin} />
    </div>
  );
}
