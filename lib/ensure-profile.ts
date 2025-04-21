import { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Sikrer at bruker har en profil i databasen
 * @param supabase Supabase-klienten
 * @param user Bruker-objektet fra supabase.auth.getUser() eller session.user
 * @returns true hvis profilen finnes eller ble opprettet, false hvis det oppstod en feil
 */
export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User | null
): Promise<boolean> {
  if (!user) return false

  try {
    // Sjekk om brukeren har en profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      // Handle case when profile doesn't exist
      if (profileError.code === 'PGRST116') {
        console.log(`ensureUserProfile: Oppretter profil for bruker ${user.id}`)
        
        // Insert with upsert to prevent race conditions
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            onboarding_completed: false,
            connected_review_platforms: []
          }, {
            onConflict: 'id'
          })
        
        if (upsertError) {
          console.error('ensureUserProfile: Feil ved oppretting av profil:', upsertError)
          return false
        }
        
        return true
      } else {
        console.error('ensureUserProfile: Feil ved henting av profil:', profileError)
        return false
      }
    }
    
    // Profil finnes allerede
    return true
  } catch (error) {
    console.error('ensureUserProfile: Uventet feil:', error)
    return false
  }
} 