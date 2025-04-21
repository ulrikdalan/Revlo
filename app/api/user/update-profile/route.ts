import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get the authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const body = await request.json();
    
    // Validate the request
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request. Missing body.' },
        { status: 400 }
      );
    }
    
    const userId = session.user.id;
    const updateData: Record<string, any> = {};
    
    // Check which fields to update
    if (body.connected_review_platforms !== undefined) {
      updateData.connected_review_platforms = body.connected_review_platforms;
    }
    
    if (body.onboarding_completed !== undefined) {
      updateData.onboarding_completed = body.onboarding_completed;
    }
    
    if (body.full_name !== undefined) {
      updateData.full_name = body.full_name;
    }
    
    // If no valid fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update.' },
        { status: 400 }
      );
    }
    
    // Update the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile.' },
        { status: 500 }
      );
    }
    
    // If updating connected platforms, consider generating dummy reviews in development mode
    if (process.env.NODE_ENV === 'development' && 
        body.connected_review_platforms && 
        body.connected_review_platforms.length > 0) {
      
      const platforms = body.connected_review_platforms;
      
      // Generate 3-5 dummy reviews for each platform
      const dummyReviewsPromises = platforms.map(async (platform: string) => {
        const reviewCount = Math.floor(Math.random() * 3) + 3; // 3-5 reviews
        const dummyReviews = Array.from({ length: reviewCount }).map((_, index) => {
          const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
          return {
            user_id: userId,
            platform: platform,
            author_name: `Test Kunde ${index + 1}`,
            rating: rating,
            comment: `Dette er en testanmeldelse for ${platform}. ${rating === 5 ? 'Veldig fornøyd med tjenesten!' : 'Ganske god opplevelse.'}`,
            published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
            external_id: `dummy-${platform}-${userId}-${index}`,
          };
        });
        
        // Insert dummy reviews
        const { error } = await supabase
          .from('external_reviews')
          .upsert(dummyReviews, { onConflict: 'external_id' });
          
        if (error) {
          console.error(`Error adding dummy reviews for ${platform}:`, error);
        }
      });
      
      // Wait for all dummy reviews to be added
      await Promise.all(dummyReviewsPromises);
    }
    
    return NextResponse.json(
      { success: true, message: 'Profile updated successfully.' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
} 