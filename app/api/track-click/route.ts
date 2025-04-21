import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Hent token fra URL parametere
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  // Verifiser at token er til stede
  if (!token) {
    return new NextResponse('Missing token parameter', { status: 400 });
  }

  // Opprett Supabase Admin klient
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Finn e-posten med den angitte token
    const { data, error } = await supabase
      .from('sent_emails')
      .select('id, review_link')
      .eq('token', token)
      .single();

    if (error || !data) {
      console.error('Error finding email with token:', error || 'No data found');
      return new NextResponse('Invalid token or link expired', { status: 400 });
    }

    // Oppdater clicked_at felt med nåværende tidspunkt
    const currentTimestamp = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('sent_emails')
      .update({ clicked_at: currentTimestamp })
      .eq('token', token);
      
    if (updateError) {
      console.error('Error updating clicked_at timestamp:', updateError);
      return new NextResponse('Error processing your request', { status: 500 });
    }
    
    console.log(`Click tracked for token: ${token} at ${currentTimestamp}`);

    // Bruk reviewLink fra databasen hvis tilgjengelig, ellers bruk Google som fallback
    const redirectUrl = data.review_link || 'https://www.google.com';
    
    // Omdiriger med status 302 (Found/Temporary Redirect)
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('Error processing click tracking:', error);
    return new NextResponse('An error occurred processing your request', { status: 500 });
  }
} 