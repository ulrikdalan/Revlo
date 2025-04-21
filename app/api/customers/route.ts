import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { name, email } = await req.json()
  
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase.from('customers').insert([{ name, email }])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}
