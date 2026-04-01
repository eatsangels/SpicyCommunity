import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { score_a, score_b } = await request.json();
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check admin role in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 3. Update the match score
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        score_a: score_a !== undefined ? score_a : null,
        score_b: score_b !== undefined ? score_b : null,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 4. Revalidate to ensure all RSC see the update
    revalidatePath('/', 'layout');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Match Score Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
