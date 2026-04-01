import CreateTournamentForm from "@/components/tournament/CreateTournamentForm";
import { createClient } from '@/lib/supabase/server';
import { redirect } from '@/i18n/routing';

export default async function CreateTournamentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: '/auth/login', locale });
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <CreateTournamentForm />
    </div>
  );
}
