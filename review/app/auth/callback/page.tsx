'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function AuthCallback() {
  const supabase = createServerComponentClient({ cookies })

  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      console.error('Auth callback – Session error:', sessionError)
      return redirect('/login?error=Autentisering+feilet')
    }

    const userId = session.user.id

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .maybeSingle()

    if (profileError) {
      console.error('Auth callback – Profile error:', profileError)
      return redirect('/login?error=Feil+ved+henting+av+profil')
    }

    // Hvis profilen ikke finnes, gå til onboarding og la den bli opprettet
    if (!profile) {
      console.warn('Auth callback – Ingen profil funnet, sender til onboarding')
      return redirect('/onboarding')
    }

    // Hvis onboarding er fullført, send til dashboard
    if (profile.onboarding_completed) {
      console.log('Auth callback – Onboarding fullført, redirecter til dashboard')
      return redirect('/dashboard')
    } else {
      console.log('Auth callback – Onboarding ikke fullført, redirecter til onboarding')
      return redirect('/onboarding')
    }

  } catch (err) {
    console.error('Auth callback – Uventet feil:', err)
    return redirect('/login?error=Uventet+feil+ved+innlogging')
  }
} 