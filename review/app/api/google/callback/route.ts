import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  error?: string;
  error_description?: string;
};

type LocationResponse = {
  locations?: {
    name: string;
    locationKey: {
      placeId: string;
    };
  }[];
  error?: {
    message: string;
    status: string;
  };
};

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code and state from the URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check for errors from Google
    if (error) {
      console.error('Google OAuth error:', error);
      return redirectWithError(`Feil fra Google: ${error}`);
    }
    
    // Validate required parameters
    if (!code || !state) {
      console.error('Missing code or state parameter');
      return redirectWithError('Manglende påkrevde parametere');
    }
    
    // Validate state parameter against cookie for CSRF protection
    const cookieStore = cookies();
    const storedState = cookieStore.get('google-oauth-state')?.value;
    
    if (!storedState || storedState !== state) {
      console.error('State parameter mismatch', { storedState, state });
      return redirectWithError('Ugyldig tilstandsparameter');
    }
    
    // Create a Supabase client for authentication
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Authentication error:', sessionError || 'No active session');
      return redirectWithError('Du må være logget inn');
    }
    
    // Get OAuth parameters from environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing OAuth configuration');
      return redirectWithError('Google OAuth er ikke konfigurert på serveren');
    }
    
    // Exchange the authorization code for access token and refresh token
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Failed to get tokens:', tokens.error || 'Unknown error');
      return redirectWithError(tokens.error_description || 'Kunne ikke hente tokens fra Google');
    }
    
    // Get the user's business location using the access token
    const location = await getBusinessLocation(tokens.access_token);
    
    if (!location.locations || location.locations.length === 0) {
      console.error('No business locations found:', location.error || 'Unknown error');
      return redirectWithError('Ingen virksomhetssteder funnet, sjekk at din Google-konto har en virksomhet koblet til');
    }
    
    // Get the first location (most apps have just one)
    const placeId = location.locations[0].locationKey.placeId;
    const placeName = location.locations[0].name;
    
    // Store tokens and place ID in Supabase
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    const { error: upsertError } = await adminSupabase
      .from('google_accounts')
      .upsert({
        user_id: session.user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        place_id: placeId,
      });
    
    if (upsertError) {
      console.error('Error storing Google account:', upsertError);
      return redirectWithError(`Feil ved lagring av Google-konto: ${upsertError.message}`);
    }
    
    // Clear the state cookie
    const clearStateCookie = 'google-oauth-state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
    
    // Redirect to success page
    const successUrl = new URL('/dashboard/google-account', request.url);
    successUrl.searchParams.set('success', 'true');
    successUrl.searchParams.set('place_name', placeName);
    
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': successUrl.toString(),
        'Set-Cookie': clearStateCookie
      }
    });
    
  } catch (error) {
    console.error('Error processing Google callback:', error);
    return redirectWithError(`En uventet feil oppstod: ${(error as Error).message}`);
  }
}

// Helper function to exchange code for tokens
async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<TokenResponse> {
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return {
      access_token: '',
      refresh_token: '',
      expires_in: 0,
      token_type: '',
      error: 'exchange_failed',
      error_description: (error as Error).message
    };
  }
}

// Helper function to get business location
async function getBusinessLocation(accessToken: string): Promise<LocationResponse> {
  try {
    const url = 'https://mybusinessbusinessinformation.googleapis.com/v1/accounts/-/locations';
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error getting business location:', error);
    return {
      error: {
        message: (error as Error).message,
        status: 'UNKNOWN'
      }
    };
  }
}

// Helper function to redirect with error
function redirectWithError(errorMessage: string): NextResponse {
  const errorUrl = new URL(`${process.env.BASE_URL}/dashboard/google-account`);
  errorUrl.searchParams.set('error', errorMessage);
  
  return NextResponse.redirect(errorUrl);
} 