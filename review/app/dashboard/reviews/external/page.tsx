'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/components/ui/use-toast';
import { Check, X } from 'lucide-react';

// Define types
type ExternalReview = {
  id: string;
  platform: string;
  author: string;
  rating: number;
  content: string;
  published_at: string;
};

type ConnectedPlatform = {
  name: string;
  isConnected: boolean;
};

export default function UserExternalReviewsPage() {
  const [reviews, setReviews] = useState<ExternalReview[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<ConnectedPlatform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { toast } = useToast();
  
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Get dummy reviews for the connected platforms
  const getDummyReviews = (platforms: string[]): ExternalReview[] => {
    // Sample reviews data
    const reviewTemplates = [
      {
        platform: 'google',
        data: [
          {
            author: 'Maria G.',
            rating: 5,
            content: 'Kjempegod opplevelse og rask respons! Jeg var veldig fornøyd med tjenesten.',
            published_at: '2024-03-15',
          },
          {
            author: 'Johan L.',
            rating: 4,
            content: 'God service og hyggelige ansatte. Kunne vært litt raskere, men ellers bra.',
            published_at: '2024-04-02',
          },
          {
            author: 'Erik M.',
            rating: 5,
            content: 'Utmerket kundeservice! Rask og effektiv hjelp. Vil absolutt anbefale til andre.',
            published_at: '2024-05-15',
          }
        ]
      },
      {
        platform: 'trustpilot',
        data: [
          {
            author: 'Kari N.',
            rating: 5,
            content: 'Fantastisk service! Løste problemet mitt på under en time. Anbefales!',
            published_at: '2024-03-20',
          },
          {
            author: 'Per S.',
            rating: 3,
            content: 'Greit nok. Fikk hjelp til slutt, men måtte vente litt for lenge.',
            published_at: '2024-04-05',
          },
          {
            author: 'Lise B.',
            rating: 4,
            content: 'God erfaring. Profesjonell håndtering og grundig arbeid, men litt dyr pris.',
            published_at: '2024-04-20',
          }
        ]
      },
      {
        platform: 'yelp',
        data: [
          {
            author: 'Erik L.',
            rating: 4,
            content: 'Flinke folk – kunne vært raskere, men god kvalitet på arbeidet.',
            published_at: '2024-04-01',
          },
          {
            author: 'Ida T.',
            rating: 5,
            content: 'Strålende kundeservice! Rask respons og profesjonell håndtering.',
            published_at: '2024-03-25',
          },
          {
            author: 'Anders J.',
            rating: 4,
            content: 'Solid håndverk og bra kundekommunikasjon. Anbefales!',
            published_at: '2024-05-05',
          }
        ]
      },
      {
        platform: 'facebook',
        data: [
          {
            author: 'Petter O.',
            rating: 4,
            content: 'Hyggelig betjening og god kvalitet. Anbefales!',
            published_at: '2024-03-28',
          },
          {
            author: 'Silje M.',
            rating: 5,
            content: 'Fantastisk opplevelse fra start til slutt! Kommer definitivt tilbake.',
            published_at: '2024-04-10',
          },
          {
            author: 'Thomas H.',
            rating: 5,
            content: 'Suveren service og profesjonell håndtering. Virkelig fornøyd!',
            published_at: '2024-05-01',
          }
        ]
      }
    ];

    // Generate dummy reviews for each connected platform
    const dummyReviews: ExternalReview[] = [];
    
    platforms.forEach(platform => {
      const template = reviewTemplates.find(t => t.platform === platform);
      if (template) {
        template.data.forEach((review, index) => {
          dummyReviews.push({
            id: `${platform}-dummy-${index}`,
            platform,
            author: review.author,
            rating: review.rating,
            content: review.content,
            published_at: review.published_at,
          });
        });
      }
    });
    
    return dummyReviews;
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // ProtectedRoute will handle redirect
          return;
        }

        const userId = session.user.id;
        
        // Fetch connected platforms from the user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('connected_review_platforms')
          .eq('id', userId)
          .single();
          
        if (profileError) {
          throw profileError;
        }
        
        const connectedPlatformNames = profileData?.connected_review_platforms || [];
        
        // Create connected platforms list with connection status
        const allPlatforms = [
          { name: 'google', isConnected: connectedPlatformNames.includes('google') },
          { name: 'trustpilot', isConnected: connectedPlatformNames.includes('trustpilot') },
          { name: 'yelp', isConnected: connectedPlatformNames.includes('yelp') },
          { name: 'facebook', isConnected: connectedPlatformNames.includes('facebook') }
        ];
        
        setConnectedPlatforms(allPlatforms);
        
        // If in development mode, generate dummy reviews for connected platforms
        if (isDevelopment || process.env.NEXT_PUBLIC_ENABLE_DUMMY_DATA === 'true') {
          setReviews(getDummyReviews(connectedPlatformNames));
        } else {
          // In production, fetch real reviews from the database
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('external_reviews')
            .select('*')
            .eq('user_id', userId)
            .order('published_at', { ascending: false });
            
          if (reviewsError) {
            console.error('Error fetching external reviews:', reviewsError);
          }
          
          // Format the review data
          const formattedReviews: ExternalReview[] = (reviewsData || []).map(review => ({
            id: review.id,
            platform: review.platform,
            author: review.author_name,
            rating: review.rating,
            content: review.comment,
            published_at: review.published_at
          }));
          
          setReviews(formattedReviews.length > 0 ? formattedReviews : []);
        }
      } catch (err: any) {
        console.error('Error fetching external reviews:', err);
        setError(err.message || 'En feil oppstod ved henting av eksterne anmeldelser');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, isDevelopment]);

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

  // Get platform info (icon/color) based on platform data
  const getPlatformInfo = (platformName: string) => {
    // Default fallbacks for platforms
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
      case 'yelp':
        return {
          color: '#D32323',
          initials: 'Y',
          displayName: 'Yelp'
        };
      default:
        return {
          color: '#9CA3AF',
          initials: platformName.substring(0, 2).toUpperCase(),
          displayName: platformName
        };
    }
  };

  // Get unique platforms from reviews
  const getUniquePlatforms = () => {
    const platformNames = reviews.map(review => review.platform);
    return ['all', ...Array.from(new Set(platformNames))];
  };

  // Render review card
  const renderReviewCard = (review: ExternalReview) => {
    const platformInfo = getPlatformInfo(review.platform);
    
    return (
      <Card key={review.id} className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback style={{ 
                backgroundColor: platformInfo.color, 
                color: '#ffffff' 
              }}>
                {platformInfo.initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-lg">{review.author}</CardTitle>
              {renderStars(review.rating)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="flex justify-between items-center mb-2 text-sm text-gray-500">
            <span className="font-medium">{platformInfo.displayName}</span>
            <span>{formatDate(review.published_at)}</span>
          </div>
          <p className="text-gray-700">{review.content || 'Ingen kommentar'}</p>
        </CardContent>
      </Card>
    );
  };

  // Render connection status section
  const renderConnectionStatus = () => {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">Tilkoblede plattformer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {connectedPlatforms.map(platform => {
              const platformInfo = getPlatformInfo(platform.name);
              return (
                <Card key={platform.name} className={cn(
                  "border",
                  platform.isConnected ? "border-green-200" : "border-gray-200"
                )}>
                  <CardContent className="flex items-center p-4">
                    <Avatar className="mr-3">
                      <AvatarFallback style={{ 
                        backgroundColor: platformInfo.color, 
                        color: '#ffffff' 
                      }}>
                        {platformInfo.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{platformInfo.displayName}</h3>
                      <div className="flex items-center mt-1">
                        {platform.isConnected ? (
                          <div className="flex items-center text-green-600">
                            <Check className="h-4 w-4 mr-1" />
                            <span className="text-sm">Tilkoblet</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <X className="h-4 w-4 mr-1" />
                            <span className="text-sm">Ikke tilkoblet</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Main render function
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      );
    }

    // Always render the connection status section
    const connectionSection = renderConnectionStatus();

    // If no reviews, show appropriate message
    if (reviews.length === 0) {
      const connectedCount = connectedPlatforms.filter(p => p.isConnected).length;
      
      return (
        <>
          {connectionSection}
          <Card>
            <CardContent className="py-6">
              <div className="text-center text-gray-500">
                {connectedCount > 0 ? (
                  <>
                    <p className="mb-4">Du har ingen eksterne anmeldelser ennå.</p>
                    <p className="text-sm">
                      {isDevelopment ? (
                        'Anmeldelser vil vises her når API-integrasjonene er konfigurert i produksjonsmiljøet.'
                      ) : (
                        'Eksterne anmeldelser fra dine tilkoblede plattformer vil vises her når de er tilgjengelige.'
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-4">Du har ikke koblet til noen eksterne plattformer ennå.</p>
                    <p className="text-sm">
                      Koble til plattformer i innstillingene for å samle anmeldelser fra Google, Trustpilot og andre tjenester.
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      );
    }

    // Render reviews with tabs for filtering
    const platforms = getUniquePlatforms();

    return (
      <>
        {connectionSection}
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            {platforms.map(platform => (
              <TabsTrigger key={platform} value={platform}>
                {platform === 'all' ? 'Alle' : getPlatformInfo(platform).displayName}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {platforms.map(platform => (
            <TabsContent key={platform} value={platform}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {platform === 'all' 
                  ? reviews.map(review => renderReviewCard(review))
                  : reviews
                      .filter(review => review.platform === platform)
                      .map(review => renderReviewCard(review))
                }
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </>
    );
  };

  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Eksterne anmeldelser</h1>
          
          {isDevelopment && (
            <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">
              Utvikling/Demo-modus
            </div>
          )}
        </div>
        
        {renderContent()}
      </div>
    </ProtectedRoute>
  );
} 