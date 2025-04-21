import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Valider input
    if (!email) {
      return NextResponse.json(
        { error: "E-postadresse er påkrevd" },
        { status: 400 }
      );
    }

    // Opprett Supabase-klient
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Vi bruker fremdeles Supabase for reset-token - den vil sette opp URL'en for oss
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.BASE_URL || 'http://localhost:3000'}/update-password`,
    });

    if (error) {
      console.error("Error generating reset password link:", error);
      return NextResponse.json(
        { error: "Kunne ikke generere tilbakestillingslink" },
        { status: 500 }
      );
    }

    // Supabase håndterer sending av e-post, så vi trenger ikke gjøre mer her
    // Supabase bruker nå de SMTP-innstillingene vi har satt i Supabase dashboard
    
    return NextResponse.json({ status: "sent" });
  } catch (error: any) {
    console.error("Error in reset password API route:", error);
    return NextResponse.json(
      { error: "Serverfeil: " + error.message },
      { status: 500 }
    );
  }
} 