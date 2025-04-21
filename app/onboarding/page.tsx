'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import { Loader2, AlertCircle } from 'lucide-react'

type ErrorState = {
  message: string;
  action?: () => void;
}

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [error, setError] = useState<ErrorState | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    console.log('Onboarding page mounted - checking auth and onboarding status')
    
    async function checkOnboarding() {
      try {
        console.log('Checking session status...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError.message)
          setError({
            message: 'Det oppstod en feil ved innhenting av sesjonsinformasjon. Prøv å logge inn på nytt.',
            action: () => router.push('/login')
          })
          setLoading(false)
          return
        }

        if (!session?.user) {
          console.log('No active session, redirecting to login')
          router.push('/login')
          return
        }

        console.log('Session found for user ID:', session.user.id)

        try {
          console.log('Checking if profile exists...')
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle()

          console.log('🔍 Profil-data:', profile)
          console.log('⚠️ Profil-feil:', profileError)

          if (profileError) {
            console.error('Profile fetch error:', profileError)
            
            if (profileError.code === 'PGRST116') {
              console.log('❗Ingen profil funnet – oppretter ny')
              
              try {
                const { error: insertError } = await supabase
                  .from('profiles')
                  .insert({
                    id: session.user.id,
                    email: session.user.email,
                    onboarding_completed: false,
                    connected_review_platforms: []
                  })
                  
                if (insertError) {
                  console.error('Error creating profile:', insertError)
                  setError({
                    message: 'Kunne ikke opprette brukerprofil. Prøv igjen senere.',
                    action: () => handleRetry()
                  })
                  setLoading(false)
                  return
                }
                
                console.log('New profile created successfully, showing onboarding wizard')
                setShowOnboarding(true)
                setLoading(false)
                return
              } catch (createError) {
                console.error('Unexpected error creating profile:', createError)
                setError({
                  message: 'En uventet feil oppstod. Prøv igjen senere.',
                  action: () => handleRetry()
                })
                setLoading(false)
                return
              }
            } else {
              console.error('Other profile error:', profileError.message)
              setError({
                message: 'Det oppstod en feil ved innhenting av profilinformasjon. Prøv igjen senere.',
                action: () => handleRetry()
              })
              setLoading(false)
              return
            }
          }

          console.log('Profile data:', profile)
          
          if (profile?.onboarding_completed) {
            console.log('Onboarding already completed, redirecting to dashboard')
            router.push('/dashboard')
          } else {
            console.log('Onboarding not completed, showing onboarding wizard')
            setShowOnboarding(true)
            setLoading(false)
          }
        } catch (profileErr) {
          console.error('Unexpected error checking profile:', profileErr)
          setError({
            message: 'En uventet feil oppstod ved sjekk av brukerprofil. Prøv igjen senere.',
            action: () => handleRetry()
          })
          setLoading(false)
        }
      } catch (err) {
        console.error('Unexpected error in checkOnboarding:', err)
        setError({
          message: 'En uventet feil oppstod. Prøv igjen senere.',
          action: () => handleRetry()
        })
        setLoading(false)
      }
    }

    checkOnboarding()
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, displaying fallback')
        setLoading(false)
        setError({
          message: 'Lasting tok for lang tid. Vennligst prøv igjen.',
          action: () => handleRetry()
        })
      }
    }, 10000) // 10-second timeout
    
    return () => clearTimeout(timeoutId)
  }, [router, isRetrying])

  const handleRetry = () => {
    console.log('Retrying onboarding check...')
    setLoading(true)
    setError(null)
    setIsRetrying(!isRetrying) // Toggle to trigger useEffect
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Laster onboarding...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-red-800 mb-2">Noe gikk galt</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          {error.action && (
            <button
              onClick={error.action}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Prøv igjen
            </button>
          )}
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingWizard />
  }

  // Fallback to prevent blank screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Forbereder onboarding...</p>
      </div>
    </div>
  )
} 