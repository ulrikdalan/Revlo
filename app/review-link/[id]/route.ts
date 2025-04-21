import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Legg til en deprekerings-advarsel i loggene
  console.warn('Deprecated API route used: /review-link/[id]. Please use /api/track-click instead.');

  // Verifiser at vi har en gyldig UUID
  const id = params.id;
  if (!id || !isValidUUID(id)) {
    return new NextResponse('Ugyldig review-lenke. Vennligst kontakt oss for å få en ny lenke.', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  // Initialiser Supabase-klienten med service role key for å oppdatere databasen
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Hent e-posten for å få review-lenken
    const { data, error } = await supabase
      .from('sent_emails')
      .select('review_link')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Feil ved henting av review-lenke:', error || 'Ingen data funnet');
      return new NextResponse('Vi kunne ikke finne denne vurderingslenken. Vennligst kontakt oss for assistanse.', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const reviewLink = data.review_link;
    
    if (!reviewLink) {
      return new NextResponse('Denne vurderingslenken er ikke gyldig lenger. Vennligst kontakt oss.', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Oppdater clicked_at timestamp (selv om redirect feiler, har vi likevel registrert klikket)
    await supabase
      .from('sent_emails')
      .update({ clicked_at: new Date().toISOString() })
      .eq('id', id);

    // Redirect til den faktiske lenken
    return NextResponse.redirect(reviewLink);
  } catch (error) {
    console.error('Feil ved behandling av review-lenke:', error);
    return new NextResponse('Det oppstod en feil. Vennligst prøv igjen senere eller kontakt oss.', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// Hjelpefunksjon for å validere UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
} 