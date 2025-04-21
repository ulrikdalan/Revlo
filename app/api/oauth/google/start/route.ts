import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    // Opprett Supabase-klient
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Hent brukerens sesjon
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Du må være logget inn for å utføre denne handlingen" },
        { status: 401 }
      );
    }
    
    // Generer en tilfeldig state-string for sikkerhet
    const state = crypto.randomBytes(16).toString("hex");
    
    // Lagre state i cookie for validering i callback
    cookieStore.set("google_oauth_state", state, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 10, // 10 minutter
      sameSite: "lax",
    });
    
    // Bygg Google OAuth URL
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.BASE_URL}/api/oauth/google/callback`;
    const scope = encodeURIComponent("https://www.googleapis.com/auth/business.manage profile email");
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
    
    // Redirect til Google OAuth-siden
    return NextResponse.redirect(authUrl);
    
  } catch (error: any) {
    console.error("OAuth start error:", error);
    return NextResponse.json(
      { error: "En uventet feil oppstod" },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic' 