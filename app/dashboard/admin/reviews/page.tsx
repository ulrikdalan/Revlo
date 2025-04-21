'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import AdminNavigation from '../AdminNavigation';

// Define types
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

export default function AdminExternalReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<ExternalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/login');
          return;
        }

        const userId = session.user.id;
        
        // Verify user is admin (bruker samme sjekk som andre admin-sider)
        // Dette bør erstattes med en mer robust rollebasert tilgangskontroll
        if (userId !== 'e3f4e47e-3db4-4b1f-bd43-bed4556f3bab' && session.user.email !== 'ulrik.fjellsta@gmail.com') {
          router.push('/dashboard');
          return;
        }

        // Fetch all external reviews
        const { data, error: fetchError } = await supabase
          .from('external_reviews')
          .select('*')
          .order('published_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setReviews(data || []);
      } catch (err: any) {
        console.error('Error fetching external reviews:', err);
        setError(err.message || 'En feil oppstod ved henting av eksterne anmeldelser');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router, supabase]);

  // Format date helper function
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP', { locale: nb });
  };

  // Render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={cn(
              "text-lg", 
              star <= rating ? "text-yellow-500" : "text-gray-300"
            )}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Get platform icon/color
  const getPlatformInfo = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'google':
        return {
          color: 'bg-blue-100 text-blue-600',
          initials: 'G'
        };
      case 'trustpilot':
        return {
          color: 'bg-green-100 text-green-600',
          initials: 'TP'
        };
      case 'facebook':
        return {
          color: 'bg-indigo-100 text-indigo-600',
          initials: 'FB'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-600',
          initials: platform.substring(0, 2).toUpperCase()
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Eksterne anmeldelser (admin)</h1>
          <AdminNavigation />
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Eksterne anmeldelser (admin)</h1>
        
        <AdminNavigation />
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {reviews.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Ingen eksterne anmeldelser funnet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => {
              const platformInfo = getPlatformInfo(review.platform);
              
              return (
                <Card key={review.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className={platformInfo.color}>
                        <AvatarFallback>{platformInfo.initials}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{review.author_name}</CardTitle>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
                      <span className="font-medium">{review.platform}</span>
                      <span>{formatDate(review.published_at)}</span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 