import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// Type for token response fra Google
type GoogleTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
};

export async function GET(req: NextRequest) {
  try {
    // Hent URL-parametere
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    
    // Opprett Supabase-klient
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Håndter feil fra Google
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?error=google_auth_failed`);
    }
    
    // Valider at code og state eksisterer
    if (!code || !state) {
      console.error("Missing code or state");
      return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?error=invalid_request`);
    }
    
    // Valider state-token fra cookie
    const storedState = cookieStore.get("google_oauth_state")?.value;
    
    if (!storedState || state !== storedState) {
      console.error("State mismatch", { storedState, receivedState: state });
      return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?error=invalid_state`);
    }
    
    // Slett state-cookie
    cookieStore.set("google_oauth_state", "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    
    // Hent brukerens sesjon
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("No session found in callback", sessionError);
      return NextResponse.redirect(`${process.env.BASE_URL}/login?error=not_authenticated`);
    }
    
    // Bytt autoriseringskode mot tokens
    const tokenResponse = await exchangeCodeForTokens(code);
    
    if (!tokenResponse) {
      console.error("Failed to exchange code for tokens");
      return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?error=token_exchange_failed`);
    }
    
    // Hent bruker-ID fra sesjonen
    const userId = session.user.id;
    
    // Hent Place ID for bedriften
    const placeId = await getGoogleBusinessPlaceId(tokenResponse.access_token);
    
    if (!placeId) {
      console.error("Failed to get Google Place ID");
      return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?error=place_id_not_found`);
    }
    
    // Opprett admin-klient for å lagre tokens
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // Lagre tokens i Supabase
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + tokenResponse.expires_in;
    
    const { data, error: upsertError } = await adminSupabase
      .from("user_google_tokens")
      .upsert({
        user_id: userId,
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_at: expiresAt,
        place_id: placeId.place_id,
        business_name: placeId.business_name,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id"
      })
      .select()
      .single();
      
    if (upsertError) {
      console.error("Error saving tokens to Supabase:", upsertError);
      return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?error=database_error`);
    }
    
    // Hent anmeldelser umiddelbart
    const fetchUrl = `${process.env.BASE_URL}/api/fetch-google-reviews`;
    await fetch(fetchUrl, {
      headers: {
        Cookie: req.headers.get("cookie") || "",
      },
    });
    
    // Redirect til dashboard med suksessmelding
    return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?success=google_connected`);
    
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${process.env.BASE_URL}/dashboard?error=unknown_error`);
  }
}

// Funksjon for å bytte autoriseringskode mot tokens
async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse | null> {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = `${process.env.BASE_URL}/api/oauth/google/callback`;
    
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    
    if (!response.ok) {
      console.error("Token exchange error:", await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    return null;
  }
}

// Funksjon for å hente Place ID for Google-bedriften
async function getGoogleBusinessPlaceId(accessToken: string): Promise<{ place_id: string, business_name: string } | null> {
  try {
    // Hent brukerens bedrifter fra Google My Business API
    const response = await fetch(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!response.ok) {
      console.error("Error fetching accounts:", await response.text());
      return null;
    }
    
    const accountsData = await response.json();
    
    if (!accountsData.accounts || accountsData.accounts.length === 0) {
      console.error("No Google My Business accounts found");
      return null;
    }
    
    // Bruk første konto (i fremtiden kan vi la brukeren velge hvilken konto)
    const accountId = accountsData.accounts[0].name.split('/').pop();
    
    // Hent lokasjoner for denne kontoen
    const locationsResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    
    if (!locationsResponse.ok) {
      console.error("Error fetching locations:", await locationsResponse.text());
      return null;
    }
    
    const locationsData = await locationsResponse.json();
    
    if (!locationsData.locations || locationsData.locations.length === 0) {
      console.error("No locations found for this account");
      return null;
    }
    
    // Bruk første lokasjon
    const location = locationsData.locations[0];
    const placeId = location.name.split('/').pop();
    const businessName = location.storeCode || location.title || "My Business";
    
    return {
      place_id: placeId,
      business_name: businessName,
    };
  } catch (error) {
    console.error("Error getting Place ID:", error);
    return null;
  }
}

export const dynamic = 'force-dynamic' 