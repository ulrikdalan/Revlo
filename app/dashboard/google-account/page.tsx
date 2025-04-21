'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

type GoogleAccount = {
  id: string;
  user_id: string;
  place_id: string;
  created_at: string;
};

export default function GoogleAccountPage() {
  const [googleAccount, setGoogleAccount] = useState<GoogleAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  // Check for success or error from Google OAuth callback
  const success = searchParams.get('success');
  const errorMsg = searchParams.get('error');
  const placeName = searchParams.get('place_name');
  
  useEffect(() => {
    if (success && placeName) {
      setBusinessName(placeName);
    }
    
    if (errorMsg) {
      setError(errorMsg);
    }
    
    async function fetchGoogleAccount() {
      setLoading(true);
      try {
        // Check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // ProtectedRoute will handle redirect
          return;
        }
        
        // Fetch Google account info for the current user
        const { data, error: fetchError } = await supabase
          .from('google_accounts')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw fetchError;
        }
        
        if (data) {
          setGoogleAccount(data);
          
          // If we don't have a business name from the URL, fetch it from Google
          if (!placeName && data.place_id) {
            await fetchBusinessName(data.place_id);
          }
        }
      } catch (err: any) {
        console.error('Error fetching Google account:', err);
        setError(err.message || 'En feil oppstod ved henting av Google-kontoinformasjon');
      } finally {
        setLoading(false);
      }
    }
    
    fetchGoogleAccount();
  }, [supabase, success, errorMsg, placeName]);
  
  const fetchBusinessName = async (placeId: string) => {
    try {
      // This would be a simplified version - in a real app, you might use the place_id
      // to fetch business details from a server endpoint that uses the Google Places API
      setBusinessName('Din virksomhet');
    } catch (err) {
      console.error('Error fetching business name:', err);
    }
  };
  
  const disconnectGoogleAccount = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Du må være logget inn for å utføre denne handlingen');
        return;
      }
      
      // Delete the Google account record
      const { error: deleteError } = await supabase
        .from('google_accounts')
        .delete()
        .eq('user_id', session.user.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Clear state
      setGoogleAccount(null);
      setBusinessName(null);
      setError(null);
      
    } catch (err: any) {
      console.error('Error disconnecting Google account:', err);
      setError(err.message || 'En feil oppstod ved frakobling av Google-konto');
    } finally {
      setLoading(false);
    }
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    if (googleAccount) {
      return (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Google-konto tilkoblet</h3>
            {businessName && (
              <p className="mb-4">
                <span className="font-medium">Virksomhet:</span> {businessName}
              </p>
            )}
            <p className="mb-4">
              <span className="font-medium">Google Place ID:</span> {googleAccount.place_id}
            </p>
            <p className="mb-4">
              <span className="font-medium">Tilkoblet:</span> {new Date(googleAccount.created_at).toLocaleString('no-NO')}
            </p>
            <div className="flex space-x-4">
              <Button 
                onClick={disconnectGoogleAccount}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                Koble fra Google-konto
              </Button>
              <Link 
                href="/dashboard/reviews/external/test-import" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
              >
                Importer Google-anmeldelser
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Koble til Google-konto</h3>
          <p className="mb-4">
            Ved å koble til din Google-konto kan du enkelt importere anmeldelser fra Google My Business.
          </p>
          <p className="mb-4">
            Du trenger en Google-konto som har tilgang til en Google My Business-oppføring.
          </p>
          <div>
            <a 
              href="/api/google/auth" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
            >
              Koble til Google
            </a>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Google-kontotilkobling</h1>
            <Link 
              href="/dashboard" 
              className="text-blue-600 hover:underline"
            >
              ← Tilbake til dashboard
            </Link>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <p>{error}</p>
            </div>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Google My Business</CardTitle>
              <CardDescription>
                Koble til din Google-konto for å administrere anmeldelser fra Google My Business
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderContent()}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}