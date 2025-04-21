'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check if email exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create a new user
        }
      });
      
      // If no error, the email exists
      if (!error) {
        return true;
      }
      
      // Check error message to determine if email exists
      if (error.message.includes('Email not confirmed') || 
          error.message.includes('Invalid login credentials')) {
        return true; // Email exists but credentials are wrong or not confirmed
      }
      
      // For other errors, assume email doesn't exist
      return false;
    } catch (err) {
      console.error('Error checking email:', err);
      return false; // Assume email doesn't exist on error
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setEmailError(null)
    
    if (password !== confirmPassword) {
      setError('Passordene samsvarer ikke')
      return
    }
    
    if (password.length < 6) {
      setError('Passordet må være minst 6 tegn')
      return
    }
    
    setLoading(true)

    try {
      // First check if email already exists
      const emailExists = await checkEmailExists(email)
      
      if (emailExists) {
        setEmailError('Det finnes allerede en bruker med denne e-postadressen')
        setLoading(false)
        return
      }
      
      // If email doesn't exist, proceed with registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        // Double-check for existing email error
        if (error.message.includes('already registered') || 
            error.message.includes('already in use') || 
            error.message.includes('existing account')) {
          setEmailError('Det finnes allerede en bruker med denne e-postadressen')
        } else {
          setError(error.message || 'En feil oppstod ved registrering')
        }
        return
      }

      if (data.user && !data.session) {
        setSuccess(
          'Registreringen var vellykket! Vi har sendt en bekreftelseslink til din e-post. ' +
          'Vennligst bekreft e-postadressen din for å logge inn.'
        )
        setEmail('')
        setPassword('')
        setConfirmPassword('')
      } else if (data.user && data.session) {
        // Om e-postverifisering er deaktivert, vil bruker logges inn direkte
        
        // Opprett profil for den nye brukeren
        await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || '',
              onboarding_completed: false,
              connected_review_platforms: []
            },
            { onConflict: 'id' }
          )
        
        router.push('/auth/callback')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Noe gikk galt. Vennligst prøv igjen.')
    } finally {
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
                Opprett en ny konto
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Kom i gang med å administrere dine kundeanmeldelser
              </p>
            </div>
            
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl relative">
                <span className="block sm:inline">{success}</span>
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
                    className={`appearance-none block w-full px-4 py-3 border ${
                      emailError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 transition-colors`}
                    placeholder="din@epost.no"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null); // Clear email error when user types
                    }}
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passord
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-gray-500">Passordet må være minst 6 tegn</p>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Bekreft passord
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full flex justify-center items-center px-8 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading ? 'opacity-80 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : null}
                  {loading ? 'Registrerer...' : 'Registrer konto'}
                </button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Har du allerede en konto?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Logg inn
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 