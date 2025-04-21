'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TestImportPage() {
  const [placeId, setPlaceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; count?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!placeId || !apiKey) {
        throw new Error('Both Place ID and API Key are required');
      }

      const response = await fetch('/api/import-google-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId, apiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import reviews');
      }

      setResult({
        success: true,
        message: data.message,
        count: data.importedCount,
      });
    } catch (err: any) {
      console.error('Error importing reviews:', err);
      setError(err.message || 'An error occurred during import');
      setResult({ success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Test Import Google Reviews</h1>
            <Link 
              href="/dashboard/reviews/external" 
              className="text-blue-600 hover:underline"
            >
              ← Back to External Reviews
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Import Google Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="placeId">Google Place ID</Label>
                  <Input
                    id="placeId"
                    value={placeId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPlaceId(e.target.value)}
                    placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    You can find your Google Place ID using the{' '}
                    <a 
                      href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Place ID Finder
                    </a>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey">Google API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value)}
                    placeholder="Your Google API Key"
                    required
                  />
                  <p className="text-sm text-gray-500">
                    The API key must have Places API enabled
                  </p>
                </div>

                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {result && result.success && (
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <p>{result.message}</p>
                    {result.count !== undefined && (
                      <p className="font-bold">Imported {result.count} reviews</p>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </span>
                  ) : (
                    'Import Reviews'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
} 