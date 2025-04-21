import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Create a Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Du må være logget inn for å koble til Google' },
        { status: 401 }
      );
    }
    
    // Get Google OAuth parameters from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { message: 'Google OAuth er ikke konfigurert på serveren' },
        { status: 500 }
      );
    }
    
    // Generate a random state parameter for security
    const state = Math.random().toString(36).substring(2);
    
    // Store the state in a cookie for validation later
    const stateValidationCookie = `google-oauth-state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`;
    
    // Build the Google OAuth URL with required permissions
    const scope = encodeURIComponent('https://www.googleapis.com/auth/business.manage');
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${state}`;
    
    // Set the state cookie and redirect to Google's authorization page
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': googleAuthUrl,
        'Set-Cookie': stateValidationCookie
      }
    });
    
  } catch (error) {
    console.error('Error starting Google OAuth flow:', error);
    return NextResponse.json(
      { message: 'Det oppstod en feil ved kobling til Google', error: (error as Error).message },
      { status: 500 }
    );
  }
} 