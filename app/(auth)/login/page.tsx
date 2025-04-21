'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    // Sjekk URL-parametere for meldinger
    const verified = searchParams.get('verified')
    const errorMsg = searchParams.get('error')
    
    if (verified === 'true') {
      setSuccess('E-postadressen din er nå bekreftet. Du kan nå logge inn.')
    }
    
    if (errorMsg) {
      setError(decodeURIComponent(errorMsg))
    }
  }, [searchParams])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setSuccess(null)
    setLoading(true)

    // Set a timeout to prevent infinite loading state
    const loginTimeout = setTimeout(() => {
      console.log('Login timeout reached after 5 seconds')
      setLoading(false)
      setError("Login tok for lang tid. Noe er galt med tilkoblingen.")
    }, 5000)

    try {
      console.log('Prøver å logge inn med:', email, '(passord skjult)')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Clear timeout since we got a response
      clearTimeout(loginTimeout)

      console.log('🔐 Login-respons:', data)
      console.log('👤 Bruker-ID:', data?.user?.id)
      
      if (error) {
        console.error('Login-feil:', error)
        
        if (error.message.includes('Email not confirmed')) {
          setInfo('E-postadressen din er ikke bekreftet. Vi har sendt en ny bekreftelseslink.')

          await supabase.auth.resend({
            type: 'signup',
            email,
          })
          
          setLoading(false)
          return
        }

        if (error.message.includes('Invalid login credentials')) {
          setError('Feil e-postadresse eller passord')
          setLoading(false)
          return
        }
        
        setError(error.message || "Ukjent feil ved innlogging")
        setLoading(false)
        return
      }

      if (data.session) {
        console.log('✅ Aktiv sesjon opprettet. Redirecter...')
        router.push('/auth/callback')
      } else {
        console.warn('⚠️ Ingen aktiv sesjon. Viser feil.')
        setError('Kunne ikke logge inn. Prøv igjen.')
        setLoading(false)
      }

    } catch (err: any) {
      // Clear timeout since we got a response
      clearTimeout(loginTimeout)
      
      console.error('Uventet login-feil:', err)
      console.error('Error stack:', err.stack)
      setError('Noe gikk galt. Vennligst prøv igjen: ' + (err.message || 'Ukjent feil'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 -z-10" />
      
      <div className="w-full max-w-md px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20" />
          <div className="relative bg-white backdrop-blur-sm bg-opacity-80 rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Logg inn på din konto
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Få tilgang til ditt dashboard og administrer dine anmeldelser
              </p>
            </div>
            
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl relative">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            
            {info && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl relative">
                <span className="block sm:inline">{info}</span>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                    E-postadresse
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passord
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link 
                    href="/forgot-password" 
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Glemt passordet?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center items-center px-8 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {loading ? 'Logger inn...' : 'Logg inn'}
                </button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Ikke registrert ennå?{' '}
                <Link 
                  href="/register" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Opprett konto
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 