import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { Loader2 } from 'lucide-react'
import DashboardStats from '@/components/dashboard/DashboardStats'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  // Hent Supabase-klient på server-siden
  const supabase = createServerComponentClient({ cookies })
  
  try {
    console.log('Dashboard: Checking session')
    // Sjekk om brukeren er logget inn
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    console.log('🔍 Profil-data:', profile)
    console.log('⚠️ Profil-feil:', profileError)

    if (!profile) {
      console.log('❗Ingen profil funnet – redirecter til onboarding')
      redirect('/onboarding')
    }
    
    // Sjekk om onboarding er fullført, hvis ikke - vis en melding i stedet for å omdirigere
    if (profile && !profile.onboarding_completed) {
      console.log('Dashboard: User profile found, onboarding not completed')
      console.log('Dashboard: Onboarding not completed, redirecting to onboarding')
      redirect('/onboarding')
    }
    
    console.log('Dashboard loaded, no redirect')
    // Returner klientsiden for dashboard med Suspense for bedre lastehåndtering
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <Button asChild>
            <Link href="/dashboard/reviews/new">
              Opprett ny forespørsel
            </Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader className="pb-8">
            <CardTitle className="text-xl">Statistikk</CardTitle>
            <CardDescription>
              Viktige tall og statistikk fra din konto
            </CardDescription>
            <DashboardStats />
          </CardHeader>
        </Card>

        <DashboardClient />
      </div>
    )
  } catch (err) {
    console.error('Dashboard: Unexpected error:', err)
    
    // Ved alvorlig feil, vis en feilmelding men tillat fortsatt tilgang
    return (
      <div className="p-6">
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Vi opplever noen tekniske problemer</p>
          <p className="mt-1 text-sm">Dashboardet lastes med begrenset funksjonalitet.</p>
        </div>
        
        <DashboardClient />
      </div>
    )
  }
}

export const dynamic = 'force-dynamic' 