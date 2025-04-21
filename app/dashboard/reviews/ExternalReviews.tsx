'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type ExternalReview = {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  published_at: string;
  platform: string;
  external_id: string;
};

type GoogleConnection = {
  id: string;
  user_id: string;
  business_name: string;
  place_id: string;
};

export default function ExternalReviews() {
  const [reviews, setReviews] = useState<ExternalReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [businessInfo, setBusinessInfo] = useState<GoogleConnection | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Hent Google-tilkobling og anmeldelser når komponenten lastes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Sjekk om bruker har koblet til Google
        const tokenResponse = await fetch('/api/oauth/google/status');
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          setGoogleConnected(!!tokenData.connected);
          
          if (tokenData.connected) {
            setBusinessInfo(tokenData.business);
            
            // Hent anmeldelser
            const reviewsResponse = await fetch('/api/fetch-google-reviews');
            
            if (reviewsResponse.ok) {
              const reviewsData = await reviewsResponse.json();
              setReviews(reviewsData.reviews || []);
            } else {
              const errorData = await reviewsResponse.json();
              setError(errorData.error || 'Kunne ikke hente anmeldelser');
            }
          }
        } else {
          setGoogleConnected(false);
        }
      } catch (err: any) {
        setError('En feil oppstod ved henting av anmeldelser');
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Funksjon for å oppdatere anmeldelser manuelt
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fetch-google-reviews');
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Kunne ikke oppdatere anmeldelser');
      }
    } catch (err: any) {
      setError('En feil oppstod ved oppdatering av anmeldelser');
      console.error('Error refreshing reviews:', err);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Funksjon for å formatere datoer
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Render stjerner basert på rating
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`text-lg ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}>
          ★
        </span>
      );
    }
    return stars;
  };
  
  // Logg inn med Google
  const connectWithGoogle = () => {
    window.location.href = '/api/oauth/google/start';
  };
  
  return (
    <div className="bg-white rounded shadow-md p-6 mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Eksterne anmeldelser</h2>
        
        {googleConnected ? (
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center disabled:opacity-50"
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Oppdaterer...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  Oppdater anmeldelser
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={connectWithGoogle}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Koble til Google
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-2">
          <p>{error}</p>
        </div>
      ) : googleConnected ? (
        <>
          {businessInfo && (
            <div className="mb-4 bg-blue-50 p-3 rounded flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.62c0-1.17.68-2.25 1.76-2.73 1.17-.51 2.61-.9 4.24-.9zM12 4a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
              <span className="text-blue-800">
                Koblet til <strong>{businessInfo.business_name}</strong> på Google
              </span>
            </div>
          )}
          
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-center mb-2">
                    <div className="font-semibold">{review.author_name}</div>
                    <div className="ml-auto text-sm text-gray-500">
                      {formatDate(review.published_at)}
                    </div>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <div className="ml-2 text-sm text-gray-600">
                      {review.platform === 'google' && 'Google'}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Ingen anmeldelser funnet for denne virksomheten.
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <h3 className="text-lg font-medium mb-2">Få oversikt over dine Google-anmeldelser</h3>
          <p className="text-gray-600 mb-4">
            Koble til din Google My Business-konto for å se og håndtere anmeldelser direkte fra dashbordet.
          </p>
          <button
            onClick={connectWithGoogle}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center mx-auto"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Koble til Google
          </button>
        </div>
      )}
    </div>
  );
} 