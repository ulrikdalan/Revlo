'use client';

import { createClientSupabaseClient } from '@/lib/supabase-client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ProtectedRoute from '@/components/ProtectedRoute'
import ReviewForm from './ReviewForm'
import SendRemindersButton from './SendRemindersButton'
import RecentExternalReviews from './RecentExternalReviews'
import { User } from '@supabase/supabase-js'
export const revalidate = 0;

export default function ReviewManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function getSession() {
      const supabase = createClientSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && session.user) {
        setUser(session.user);
      }
      
      setIsLoading(false);
    }
    
    getSession();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="mb-6 border-0 shadow-lg overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Anmeldelser</CardTitle>
          </CardHeader>
        </Card>

        <ProtectedRoute>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
            {/* Review Form Section */}
            <div className="lg:col-span-5">
              <Card className="h-full border-0 shadow-lg overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardHeader>
                  <CardTitle>Send anmeldelsesforespørsel</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <ReviewForm />
                </CardContent>
              </Card>
            </div>

            {/* External Reviews Section */}
            <div className="lg:col-span-7">
              <Card className="h-full border-0 shadow-lg overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                  <CardTitle>Nylige eksterne anmeldelser</CardTitle>
                  <div className="flex space-x-2">
                    <Link 
                      href="/dashboard/sent-reviews"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm text-blue-700 bg-blue-50 border border-blue-100 font-medium hover:bg-blue-100 transition-colors"
                    >
                      Se sendte forespørsler
                    </Link>
                    <Link 
                      href="/dashboard/reviews/external"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 font-medium hover:bg-indigo-100 transition-colors"
                    >
                      Se alle eksterne
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <SendRemindersButton />
                  </div>
                  <RecentExternalReviews />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Features Section */}
          <div className="mt-6">
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <CardHeader>
                <CardTitle>Importer eksterne anmeldelser</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                  <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3">Google anmeldelser</h3>
                    <p className="text-gray-600 mb-4">Importer anmeldelser fra Google My Business for å få en helhetlig oversikt.</p>
                    <Link 
                      href="/dashboard/reviews/import/google"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 font-medium hover:from-blue-700 hover:to-blue-800 transition-colors"
                    >
                      Importer fra Google
                    </Link>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-white p-6 rounded-xl border border-yellow-100 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3">Tripadvisor anmeldelser</h3>
                    <p className="text-gray-600 mb-4">Hent inn dine Tripadvisor-anmeldelser for å få en samlet oversikt.</p>
                    <Link 
                      href="/dashboard/reviews/import/tripadvisor"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-yellow-600 to-yellow-700 font-medium hover:from-yellow-700 hover:to-yellow-800 transition-colors"
                    >
                      Importer fra Tripadvisor
                    </Link>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">Facebook anmeldelser</h3>
                    <p className="text-gray-600 mb-4">Samle dine Facebook-anmeldelser for en komplett oversikt.</p>
                    <Link 
                      href="/dashboard/reviews/import/facebook"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm text-white bg-gradient-to-r from-purple-600 to-purple-700 font-medium hover:from-purple-700 hover:to-purple-800 transition-colors"
                    >
                      Importer fra Facebook
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ProtectedRoute>
      </div>
    </div>
  )
} 
