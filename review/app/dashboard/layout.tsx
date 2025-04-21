'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, BarChart, Send } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error fetching session:', error)
          router.push('/login')
          return
        }

        if (!session) {
          router.push('/login')
          return
        }

        setSession(session)
        
        // Check onboarding status
        if (pathname !== '/onboarding') {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .single()
          
          if (profileError) {
            console.error('Error fetching profile:', profileError)
          } else if (profile && profile.onboarding_completed === false) {
            // Redirect to onboarding if not completed
            router.push('/onboarding')
            return
          }
        }
        
        // Check if user is admin based on environment variable
        const adminUserId = process.env.NEXT_PUBLIC_ADMIN_USER_ID
        if (adminUserId && session.user?.id === adminUserId) {
          setIsAdmin(true)
        }
      } catch (error) {
        console.error('Auth error:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router, supabase, pathname])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-800">Review Manager</Link>
              </div>
              <div className="ml-6 flex space-x-8">
                {/* Simplified main navigation */}
                <Link 
                  href="/dashboard" 
                  className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium pointer-events-auto relative z-10 ${
                    pathname === '/dashboard' 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Home size={16} />
                  Dashboard
                </Link>
                <Link 
                  href="/dashboard/analytics" 
                  className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium pointer-events-auto relative z-10 ${
                    pathname === '/dashboard/analytics' || pathname === '/dashboard/overview'
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <BarChart size={16} />
                  Statistikk
                </Link>
                <Link 
                  href="/dashboard/reviews" 
                  className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium pointer-events-auto relative z-10 ${
                    pathname === '/dashboard/reviews' 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Send size={16} />
                  Send forespørsel
                </Link>
                {isAdmin && (
                  <Link 
                    href="/dashboard/admin" 
                    className={`inline-flex items-center gap-2 px-3 pt-1 border-b-2 text-sm font-medium pointer-events-auto relative z-10 ${
                      pathname?.includes('/dashboard/admin')
                        ? 'border-blue-500 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <span className="text-red-600 font-semibold">Admin</span>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center relative z-20">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 pointer-events-auto relative z-10"
                type="button"
              >
                Logg ut
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
} 