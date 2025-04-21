import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET: Hent alle e-postmaler for innlogget bruker
export async function GET(request: NextRequest) {
  try {
    // Opprett Supabase-klient med cookies for å hente brukersesjonen
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Hent gjeldende brukersesjon
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Sjekk om brukeren er logget inn
    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: "Du må være logget inn for å utføre denne handlingen" },
        { status: 401 }
      );
    }
    
    // Hent bruker-ID fra sesjonen
    const userId = session.user.id;
    
    // Hent alle maler for brukeren fra databasen
    const { data: templates, error: fetchError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (fetchError) {
      console.error("Error fetching email templates:", fetchError);
      return NextResponse.json(
        { error: fetchError.message || "Feil ved henting av e-postmaler" },
        { status: 500 }
      );
    }
    
    // Returner templatene til klienten
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "En uventet feil oppstod" },
      { status: 500 }
    );
  }
}

// POST: Opprett en ny e-postmal for innlogget bruker
export async function POST(request: NextRequest) {
  try {
    // Parse innkommende JSON-data
    const { name, subject, content } = await request.json();
    
    // Valider inndata
    if (!name || !subject || !content) {
      return NextResponse.json(
        { error: "Navn, emne og innhold er påkrevd" },
        { status: 400 }
      );
    }
    
    // Opprett Supabase-klient med cookies for å hente brukersesjonen
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Hent gjeldende brukersesjon
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Sjekk om brukeren er logget inn
    if (sessionError || !session || !session.user) {
      return NextResponse.json(
        { error: "Du må være logget inn for å utføre denne handlingen" },
        { status: 401 }
      );
    }
    
    // Hent bruker-ID fra sesjonen
    const userId = session.user.id;
    
    // Lagre malen i databasen
    const { data: template, error: insertError } = await supabase
      .from("email_templates")
      .insert([
        {
          user_id: userId,
          name,
          subject,
          content
        }
      ])
      .select()
      .single();
    
    if (insertError) {
      console.error("Error creating email template:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Feil ved oppretting av e-postmal" },
        { status: 500 }
      );
    }
    
    // Returner den nyopprettede malen til klienten
    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "En uventet feil oppstod" },
      { status: 500 }
    );
  }
} 