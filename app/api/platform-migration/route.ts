import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    // Check admin status
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'You must be logged in to run migrations' },
        { status: 401 }
      )
    }

    // Get user profile to check if admin
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    if (profileError || !profileData?.is_admin) {
      return NextResponse.json(
        { error: 'You must be an admin to run migrations' },
        { status: 403 }
      )
    }

    // Run the migrations
    const migrationResults = []

    // 1. First check if platforms table exists
    const { data: tableExists, error: tableCheckError } = await supabase
      .from('platforms')
      .select('id')
      .limit(1)
      .maybeSingle()

    // If we get a relation not found error, table doesn't exist
    if (tableCheckError && tableCheckError.message.includes('relation "platforms" does not exist')) {
      // Create platforms table using SQL
      const { error: createTableError } = await supabase.rpc('create_platforms_table', {})
      
      if (createTableError) {
        // If the RPC doesn't exist, create the table directly
        const { error: sqlError } = await supabase.rpc('exec_sql', {
          sql_query: `
            CREATE TABLE IF NOT EXISTS platforms (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              name TEXT NOT NULL UNIQUE,
              display_name TEXT NOT NULL,
              icon TEXT,
              color TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
            );
          `
        })
        
        if (sqlError) {
          migrationResults.push({
            name: 'Create platforms table',
            success: false,
            error: sqlError.message
          })
        } else {
          migrationResults.push({
            name: 'Create platforms table',
            success: true
          })
        }
      } else {
        migrationResults.push({
          name: 'Create platforms table',
          success: true
        })
      }
      
      // Insert default platforms
      const defaultPlatforms = [
        { name: 'google', display_name: 'Google', icon: 'G', color: '#4285F4' },
        { name: 'trustpilot', display_name: 'Trustpilot', icon: 'TP', color: '#00B67A' },
        { name: 'facebook', display_name: 'Facebook', icon: 'FB', color: '#1877F2' },
        { name: 'yelp', display_name: 'Yelp', icon: 'Y', color: '#FF1A1A' }
      ]
      
      const { error: insertError } = await supabase
        .from('platforms')
        .insert(defaultPlatforms)
      
      migrationResults.push({
        name: 'Insert default platforms',
        success: !insertError,
        error: insertError?.message
      })
    } else {
      migrationResults.push({
        name: 'Platforms table',
        success: true,
        message: 'Table already exists'
      })
    }

    return NextResponse.json({
      success: true,
      migrations: migrationResults
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred during migration' },
      { status: 500 }
    )
  }
} 