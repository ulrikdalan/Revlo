import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
  
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
    
    if (tokensError && tokensError.code !== 'PGRST116') { // PGRST116 = No rows returned
      console.error('Error fetching Google token:', tokensError);
      return NextResponse.json(
        { error: 'Kunne ikke hente token-informasjon' },
        { status: 500 }
      );
    }
    
    if (!tokens) {
      return NextResponse.json({ connected: false });
    }
    
    const now = Math.floor(Date.now() / 1000);
    const isExpired = tokens.expires_at < now;
    
    // Vi inkluderer virksomhetsinformasjon hvis tilkoblet og ikke utløpt
    return NextResponse.json({
      connected: !isExpired,
      business: isExpired ? null : {
        id: tokens.id,
        user_id: tokens.user_id,
        business_name: tokens.business_name,
        place_id: tokens.place_id
      }
    });
  } catch (error) {
    console.error('Unexpected error in Google status check:', error);
    return NextResponse.json(
      { error: 'En uventet feil oppstod' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic' 