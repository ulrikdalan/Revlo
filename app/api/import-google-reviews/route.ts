import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type GoogleReview = {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  profile_photo_url?: string;
};

type GooglePlaceResponse = {
  result: {
    name: string;
    rating: number;
    reviews: GoogleReview[];
  };
  status: string;
  error_message?: string;
};

type GoogleAccount = {
  access_token: string;
  refresh_token: string;
  place_id: string;
};

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { placeId, apiKey } = requestData;
    
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // If both placeId and apiKey are provided in the request, use those directly
    if (placeId && apiKey) {
      return await importReviewsWithApiKey(placeId, apiKey, session.user.id);
    }
    
    // Otherwise, try to use the connected Google account if available
    // Create admin client with service role to fetch tokens
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    
    // Fetch Google account for the user
    const { data: googleAccount, error: accountError } = await adminSupabase
      .from('google_accounts')
      .select('access_token, refresh_token, place_id')
      .eq('user_id', session.user.id)
      .single();
    
    if (accountError || !googleAccount) {
      return NextResponse.json(
        { 
          message: 'Ingen Google-konto er koblet til. Vennligst koble til Google-kontoen din eller angi placeId og apiKey.',
          error: accountError?.message 
        },
        { status: 400 }
      );
    }
    
    // Use the connected Google account
    return await importReviewsWithGoogleAccount(googleAccount, session.user.id);
    
  } catch (error) {
    console.error('Error in import-google-reviews:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Import reviews using API key
async function importReviewsWithApiKey(placeId: string, apiKey: string, userId: string) {
  // Fetch Google Place details with reviews
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json() as GooglePlaceResponse;
  
  if (data.status !== 'OK') {
    return NextResponse.json(
      { message: `Google API error: ${data.status}`, error: data.error_message },
      { status: 400 }
    );
  }
  
  return await processAndStoreReviews(data, userId);
}

// Import reviews using Google account
async function importReviewsWithGoogleAccount(googleAccount: GoogleAccount, userId: string) {
  // Validate Google account data
  if (!googleAccount.access_token || !googleAccount.place_id) {
    return NextResponse.json(
      { message: 'Manglende Google-kontodata' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch reviews using OAuth token
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/-/locations/${googleAccount.place_id}/reviews`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${googleAccount.access_token}`,
      },
    });
    
    // If the token fails, we would need to refresh it
    if (response.status === 401) {
      // Here we would implement token refresh logic, but it's beyond the scope of this example
      return NextResponse.json(
        { message: 'Google OAuth token has expired. Please reconnect your Google account.' },
        { status: 401 }
      );
    }
    
    const data = await response.json();
    
    // Convert the Google My Business API response format to match our expected GooglePlaceResponse format
    // Note: The actual response format from the My Business API is different than Places API,
    // so this would need to be adapted in a real application
    const adaptedData: GooglePlaceResponse = {
      result: {
        name: "Business Name", // Would be replaced with actual name
        rating: 0, // Would be replaced with actual rating
        reviews: (data.reviews || []).map((review: any) => ({
          author_name: review.reviewer.displayName || 'Anonymous',
          rating: review.starRating || 0,
          text: review.comment || '',
          time: Date.parse(review.createTime) / 1000, // Convert to Unix timestamp
        }))
      },
      status: 'OK'
    };
    
    return await processAndStoreReviews(adaptedData, userId);
    
  } catch (error) {
    console.error('Error fetching reviews with Google account:', error);
    return NextResponse.json(
      { message: 'Error fetching reviews with Google account', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// Process and store reviews in the database
async function processAndStoreReviews(data: GooglePlaceResponse, userId: string) {
  const { result } = data;
  
  if (!result.reviews || result.reviews.length === 0) {
    return NextResponse.json(
      { message: 'No reviews found for this place' },
      { status: 404 }
    );
  }
  
  // Create Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  // Process and store reviews
  const reviews = result.reviews.map((review: GoogleReview) => ({
    user_id: userId,
    platform: 'Google',
    external_id: review.time.toString(),
    author_name: review.author_name || 'Anonymous',
    rating: review.rating,
    comment: review.text || '',
    published_at: new Date(review.time * 1000).toISOString(),
    created_at: new Date().toISOString()
  }));
  
  // Insert reviews into the database
  const { data: insertedReviews, error } = await supabase
    .from('external_reviews')
    .upsert(reviews, { 
      onConflict: 'user_id,platform,external_id',
      ignoreDuplicates: true 
    });
  
  if (error) {
    console.error('Error storing reviews:', error);
    return NextResponse.json(
      { message: 'Error storing reviews', error: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    message: 'Reviews imported successfully',
    imported: reviews.length,
    total: result.reviews.length,
    place_name: result.name
  });
} 