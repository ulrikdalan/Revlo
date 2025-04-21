import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Ikke pålogget' },
        { status: 401 }
      );
    }
    
    // Sjekk om brukeren har koblet til Google
    const { data: tokens, error: tokensError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', session.user.id)
      .single();
    
    if (tokensError) {
      console.error('Error fetching Google token:', tokensError);
      return NextResponse.json(
        { error: 'Kunne ikke hente token-informasjon' },
        { status: 500 }
      );
    }
    
    if (!tokens || !tokens.access_token) {
      return NextResponse.json(
        { error: 'Google-konto ikke tilkoblet' },
        { status: 400 }
      );
    }
    
    // Sjekk om tokenet er utløpt og oppdater om nødvendig
    const now = Math.floor(Date.now() / 1000);
    let accessToken = tokens.access_token;
    
    if (tokens.expires_at < now) {
      // Token er utløpt, prøv å fornye det
      if (!tokens.refresh_token) {
        return NextResponse.json(
          { error: 'Token er utløpt og kan ikke fornyes' },
          { status: 401 }
        );
      }
      
      // Her ville vi normalt ha kode for å fornye tokenet med Google API
      // Dette er bare en dummy-implementasjon for nå
      return NextResponse.json(
        { error: 'Token er utløpt. Logg inn på nytt for å koble til Google' },
        { status: 401 }
      );
    }
    
    // Her ville vi normalt hente anmeldelser fra Google My Business API
    // Dette er bare dummydata for nå
    const mockReviews = [
      {
        id: 'review1',
        reviewer_name: 'Ola Nordmann',
        rating: 5,
        comment: 'Utmerket service og rask levering!',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review2',
        reviewer_name: 'Kari Nordmann',
        rating: 4,
        comment: 'God opplevelse, men litt lang ventetid.',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'review3',
        reviewer_name: 'Per Hansen',
        rating: 5,
        comment: 'Fantastisk produkt! Anbefales på det sterkeste.',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    return NextResponse.json({
      reviews: mockReviews,
      business: {
        name: tokens.business_name,
        place_id: tokens.place_id
      }
    });
    
  } catch (error) {
    console.error('Unexpected error fetching Google reviews:', error);
    return NextResponse.json(
      { error: 'En uventet feil oppstod' },
      { status: 500 }
    );
  }
} 