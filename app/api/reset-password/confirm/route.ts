import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { password } = await request.json();
    const urlObj = new URL(request.url);
    const token = urlObj.searchParams.get('token');

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token og passord er påkrevd' },
        { status: 400 }
      );
    }

    // Verify the reset token
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    });

    if (verifyError) {
      console.error('Token verification error:', verifyError);
      return NextResponse.json(
        { error: verifyError.message || 'Ugyldig eller utløpt token' },
        { status: 400 }
      );
    }

    // Update the user's password
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        { error: error.message || 'Kunne ikke oppdatere passordet' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Passordet er oppdatert' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Feil ved passordtilbakestilling:', error);
    return NextResponse.json(
      { error: 'Serverfeil' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic'