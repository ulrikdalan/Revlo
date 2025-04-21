import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { source, goal } = json;

    // Validate input
    if (!source && !goal) {
      return NextResponse.json({ error: 'No feedback provided' }, { status: 400 });
    }

    // Get the user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert feedback into the database
    const { data, error } = await supabase
      .from('onboarding_feedback')
      .insert({
        user_id: session.user.id,
        source,
        goal,
      });

    if (error) {
      console.error('Error saving onboarding feedback:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in onboarding feedback API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic' 