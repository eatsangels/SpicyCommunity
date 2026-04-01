"use server";

import { TournamentService } from "@/lib/services/tournament-service";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createTournamentAction(formData: {
  name: string;
  description: string;
  type: 'single_elimination' | 'double_elimination';
  participants: string; // JSON string from client
  scheduledAt?: string | null;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can create tournaments");
    }

    const participantsData: { name: string; logo_url: string | null; team_id?: string | null }[] = JSON.parse(formData.participants);

    if (participantsData.length < 2) {
      throw new Error("At least 2 participants required");
    }

    const tournament = await TournamentService.createTournament(
      {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        scheduled_at: formData.scheduledAt ?? null,
        status: formData.scheduledAt ? 'scheduled' : 'draft',
      },
      participantsData.map(p => ({ name: p.name, logo_url: p.logo_url ?? null }))
    );

    revalidatePath("/admin/tournaments");
    revalidatePath("/");
    
    return { success: true, tournamentId: tournament.id };
  } catch (error: any) {
    console.error("Action Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateTournamentAction(tournamentId: string, formData: {
  name: string;
  description: string;
  type: 'single_elimination' | 'double_elimination';
  participants: string; // JSON string from client
  scheduledAt?: string | null;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can update tournaments");
    }

    const participantsData: { name: string; logo_url: string | null; team_id?: string | null }[] = JSON.parse(formData.participants);

    if (participantsData.length < 2) {
      throw new Error("At least 2 participants required");
    }

    await TournamentService.updateTournamentParticipants(
      tournamentId,
      {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        scheduled_at: formData.scheduledAt ?? null,
      },
      participantsData.map(p => ({ name: p.name, logo_url: p.logo_url ?? null }))
    );

    revalidatePath("/admin/tournaments");
    revalidatePath(`/tournaments/${tournamentId}`);
    revalidatePath("/");
    
    return { success: true, tournamentId };
  } catch (error: any) {
    console.error("Action Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteTournamentAction(id: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error("Unauthorized: Only admins can delete tournaments");
    }

    // El borrado en cascada (CASCADE) manejará los partidos, rondas y participantes asociados
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) {
       throw error;
    }

    revalidatePath("/admin/tournaments");
    revalidatePath("/");
    revalidatePath("/winners");
    
    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleTournamentLikeAction(tournamentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "not_registered" };
    }

    // Check if the like already exists
    const { data: existingLike } = await supabase
      .from('tournament_likes')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Dislike (delete)
      await supabase
        .from('tournament_likes')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('user_id', user.id);
      
      revalidatePath("/");
      return { success: true, liked: false };
    } else {
      // Like (insert)
      await supabase
        .from('tournament_likes')
        .insert({
          tournament_id: tournamentId,
          user_id: user.id
        });
        
      revalidatePath("/");
      return { success: true, liked: true };
    }
  } catch (error: any) {
    console.error("Toggle Like Error:", error);
    return { success: false, error: error.message };
  }
}
