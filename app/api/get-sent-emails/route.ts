import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  try {
    // Autentisering - hent brukerens sesjon
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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

    // Admin Supabase-klient for databasetilgang
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        }
      }
    );

    // Hent e-poster fra databasen
    const { data, error: fetchError } = await adminSupabase
      .from("sent_emails")
      .select("*")
      .eq("user_id", userId)
      .order("sent_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching sent emails:", fetchError);
      return NextResponse.json(
        { error: fetchError.message || "Feil ved henting av e-poster" },
        { status: 500 }
      );
    }

    // Returner data
    return NextResponse.json({ emails: data || [] });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "En uventet feil oppstod" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic' 