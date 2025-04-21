import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Opprett en type for token-info lagret i Supabase
type GoogleToken = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  place_id: string;
};

// Type for Google Place Details response
type GoogleReview = {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  author_url?: string;
  profile_photo_url?: string;
  relative_time_description?: string;
  language?: string;
};

type PlaceDetailsResponse = {
  result: {
    reviews?: GoogleReview[];
    name?: string;
    place_id: string;
  };
  status: string;
};

export async function GET(req: NextRequest) {
  try {
    // Opprett Supabase-klient
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Hent brukerens sesjon
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Du må være logget inn for å utføre denne handlingen" },
        { status: 401 }
      );
    }
    
    // Hent bruker-ID fra sesjonen
    const userId = session.user.id;
    
    // Hent brukerens Google-token fra Supabase
    const { data: userData, error: userError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (userError || !userData) {
      return NextResponse.json(
        { error: "Du har ikke koblet opp Google My Business ennå" },
        { status: 404 }
      );
    }
    
    const tokenData = userData as unknown as GoogleToken;
    
    // Sjekk om token er utløpt
    const now = Math.floor(Date.now() / 1000);
    if (now >= tokenData.expires_at) {
      // Token er utløpt, vi må oppdatere den
      const refreshedToken = await refreshGoogleToken(tokenData.refresh_token);
      
      if (!refreshedToken) {
        return NextResponse.json(
          { error: "Kunne ikke oppdatere Google-tilkobling. Vennligst koble til på nytt." },
          { status: 401 }
        );
      }
      
      // Oppdater token i databasen
      const { error: updateError } = await supabase
        .from('user_google_tokens')
        .update({
          access_token: refreshedToken.access_token,
          expires_at: now + refreshedToken.expires_in,
        })
        .eq('user_id', userId);
        
      if (updateError) {
        console.error("Feil ved oppdatering av token:", updateError);
        return NextResponse.json(
          { error: "Feil ved oppdatering av Google-tilkobling" },
          { status: 500 }
        );
      }
      
      tokenData.access_token = refreshedToken.access_token;
    }
    
    // Hent anmeldelser fra Google Places API
    const placeId = tokenData.place_id;
    if (!placeId) {
      return NextResponse.json(
        { error: "Ingen place_id funnet for denne brukeren" },
        { status: 400 }
      );
    }
    
    const reviews = await fetchGoogleReviews(placeId, tokenData.access_token);
    
    if (!reviews) {
      return NextResponse.json(
        { error: "Kunne ikke hente anmeldelser fra Google" },
        { status: 500 }
      );
    }
    
    // Opprett admin-klient for å hente alle eksterne anmeldelser
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    );
    
    // Hent eksisterende anmeldelser for å unngå duplikater
    const { data: existingReviews, error: existingError } = await adminSupabase
      .from('external_reviews')
      .select('external_id')
      .eq('user_id', userId)
      .eq('platform', 'google');
      
    if (existingError) {
      console.error("Feil ved henting av eksisterende anmeldelser:", existingError);
      return NextResponse.json(
        { error: "Feil ved henting av eksisterende anmeldelser" },
        { status: 500 }
      );
    }
    
    // Opprett et sett med eksisterende external_ids
    const existingIds = new Set(existingReviews.map(review => review.external_id));
    
    // Lagre nye anmeldelser i Supabase
    const newReviews = reviews.filter(review => !existingIds.has(`google_${review.time}`));
    
    if (newReviews.length > 0) {
      const reviewsToInsert = newReviews.map(review => ({
        user_id: userId,
        platform: 'google',
        author_name: review.author_name,
        rating: review.rating,
        comment: review.text,
        published_at: new Date(review.time * 1000).toISOString(),
        external_id: `google_${review.time}`,
      }));
      
      const { error: insertError } = await adminSupabase
        .from('external_reviews')
        .insert(reviewsToInsert);
        
      if (insertError) {
        console.error("Feil ved lagring av anmeldelser:", insertError);
        return NextResponse.json(
          { error: "Feil ved lagring av anmeldelser" },
          { status: 500 }
        );
      }
    }
    
    // Hent alle anmeldelser for brukeren
    const { data: allReviews, error: allError } = await supabase
      .from('external_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'google')
      .order('published_at', { ascending: false });
      
    if (allError) {
      console.error("Feil ved henting av anmeldelser:", allError);
      return NextResponse.json(
        { error: "Feil ved henting av anmeldelser" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      reviews: allReviews,
      added: newReviews.length,
      total: allReviews.length,
    });
    
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "En uventet feil oppstod" },
      { status: 500 }
    );
  }
}

// Funksjon for å oppdatere utløpt token
async function refreshGoogleToken(refreshToken: string) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      console.error("Refresh token error:", await response.text());
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

// Funksjon for å hente anmeldelser fra Google Places API
async function fetchGoogleReviews(placeId: string, accessToken: string): Promise<GoogleReview[] | null> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    // Bruk Places API med API-nøkkel
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,name,place_id&key=${apiKey}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      console.error("Places API error:", await response.text());
      return null;
    }
    
    const data = await response.json() as PlaceDetailsResponse;
    
    if (data.status !== 'OK' || !data.result.reviews) {
      console.error("No reviews found or API error:", data);
      return [];
    }
    
    return data.result.reviews;
  } catch (error) {
    console.error("Error fetching Google reviews:", error);
    return null;
  }
} 