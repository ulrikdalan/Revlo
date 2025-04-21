'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type ExternalReview = {
  id: string;
  user_id: string;
  platform: string;
  author_name: string;
  rating: number;
  comment: string;
  published_at: string;
  created_at: string;
};

type Platform = {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  color: string;
};

export default function RecentExternalReviews() {
  const [reviews, setReviews] = useState<ExternalReview[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          return;
        }

        const userId = session.user.id;
        
        // Fetch platforms
        const { data: platformsData, error: platformsError } = await supabase
          .from('platforms')
          .select('*')
          .order('name');
          
        if (!platformsError) {
          setPlatforms(platformsData || []);
        }
        
        // Fetch only the latest 3 external reviews
        const { data, error: fetchError } = await supabase
          .from('external_reviews')
          .select('*')
          .eq('user_id', userId)
          .order('published_at', { ascending: false })
          .limit(3);

        if (fetchError) {
          throw fetchError;
        }

        setReviews(data || []);
      } catch (err: any) {
        console.error('Error fetching recent external reviews:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Format date helper function
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'd. MMM yyyy', { locale: nb });
  };

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={cn(
              "text-sm", 
              star <= rating ? "text-yellow-500" : "text-gray-300"
            )}
          >
            ★
          </span>
        ))}
      </div>
    );
  };
  
  // Get platform info from platforms table
  const getPlatformInfo = (platformName: string) => {
    const platform = platforms.find(p => p.name.toLowerCase() === platformName.toLowerCase());
    
    if (platform) {
      return {
        color: platform.color || '#e5e7eb',
        initials: platform.icon || platform.name.substring(0, 1).toUpperCase(),
        displayName: platform.display_name || platformName
      };
    }
    
    // Default fallbacks if platform not found in our database
    switch (platformName.toLowerCase()) {
      case 'google':
        return {
          color: '#4285F4',
          initials: 'G',
          displayName: 'Google'
        };
      case 'trustpilot':
        return {
          color: '#00B67A',
          initials: 'TP',
          displayName: 'Trustpilot'
        };
      case 'facebook':
        return {
          color: '#1877F2',
          initials: 'FB',
          displayName: 'Facebook'
        };
      default:
        return {
          color: '#9CA3AF',
          initials: platformName.substring(0, 2).toUpperCase(),
          displayName: platformName
        };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nyeste eksterne anmeldelser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nyeste eksterne anmeldelser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm">Kunne ikke laste anmeldelser</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Nyeste eksterne anmeldelser</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-3">
            Ingen eksterne anmeldelser funnet
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const platformInfo = getPlatformInfo(review.platform);
              
              return (
                <div key={review.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback style={{ 
                          backgroundColor: platformInfo.color, 
                          color: '#ffffff',
                          fontSize: '10px'
                        }}>
                          {platformInfo.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-sm">{review.author_name}</div>
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(review.published_at)}</div>
                  </div>
                  <div className="flex items-center mb-1 ml-8">
                    {renderStars(review.rating)}
                    <span className="ml-2 text-xs text-gray-600 font-medium">
                      {platformInfo.displayName}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-700 line-clamp-2 ml-8">{review.comment}</p>
                  )}
                </div>
              );
            })}
            
            <div className="text-center pt-2">
              <Link 
                href="/dashboard/reviews/external" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Se alle anmeldelser →
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 