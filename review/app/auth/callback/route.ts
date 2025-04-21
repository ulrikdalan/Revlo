import { NextResponse, type NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const type = requestUrl.searchParams.get('type')
  
  // Logg feil hvis det finnes
  if (error) {
    console.error('Auth callback error:', error_description)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || 'En feil oppstod')}`, request.url)
    )
  }

  // Hvis det er en kode, bytt den mot en sesjon
  if (code) {
    // Opprett en Supabase klient med cookies
    const supabase = createRouteHandlerClient({ cookies })

    // Bytt godkjenningskode for en sesjon
    await supabase.auth.exchangeCodeForSession(code)
    
    // Hent bruker etter at vi har byttet kode mot sesjon
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      console.log('Auth callback - Bruker autentisert:', user.id)
      
      // Sjekk om brukeren har en profil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, onboarding_completed')
        .eq('id', user.id)
        .single()
      
      // Hvis brukeren ikke har en profil, opprett en
      if (profileError || !profileData) {
        console.log('Auth callback - Ingen profil funnet, oppretter ny profil for bruker:', user.id)
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            onboarding_completed: false,
            connected_review_platforms: []
          })
        
        if (insertError) {
          console.error('Auth callback - Feil ved oppretting av brukerprofil:', insertError)
        } else {
          console.log('Auth callback - Brukerprofil opprettet vellykket')
        }
      } else {
        console.log('Auth callback - Brukerprofil funnet. Onboarding status:', profileData.onboarding_completed)
      }
    }
    
    // Omdirigering basert på type
    if (type === 'recovery') {
      // Passordtilbakestilling
      return NextResponse.redirect(new URL('/update-password', request.url))
    } else if (type === 'signup') {
      // E-postverifisering etter registrering - sjekk om onboarding er fullført
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single()
        
        if (profile?.onboarding_completed) {
          console.log('Auth callback - Verifisert bruker med fullført onboarding, omdirigerer til dashboard')
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          console.log('Auth callback - Verifisert bruker, men onboarding ikke fullført, omdirigerer til login')
          return NextResponse.redirect(new URL('/login?verified=true', request.url))
        }
      }
    }
  }

  // Standard omdirigering til dashboard
  return NextResponse.redirect(new URL('/dashboard', request.url))
} 