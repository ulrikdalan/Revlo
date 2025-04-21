import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// Funksjon for å opprette Supabase-klient med cookies
function createServerClient() {
  const cookieStore = cookies();
  return createRouteHandlerClient({ cookies: () => cookieStore });
}

// Admin-klient med service role for databasetilgang
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false
    }
  }
);

export async function POST(req: NextRequest) {
  const { email, name, reviewLink, subject, body } = await req.json();

  // Valider inndata
  if (!email || !name || !reviewLink) {
    return NextResponse.json(
      { error: "E-post, navn og anmeldelseslenke er påkrevd" },
      { status: 400 }
    );
  }

  // Valider e-post format (enkel validering)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Ugyldig e-postformat" },
      { status: 400 }
    );
  }

  // Verifiser at BASE_URL er satt
  if (!process.env.BASE_URL) {
    return NextResponse.json(
      { error: "BASE_URL er ikke definert i miljøvariablene. Vennligst sett BASE_URL i .env.local" },
      { status: 500 }
    );
  }

  // Opprett Supabase-klient med cookies for å hente brukersesjonen
  const supabase = createServerClient();
  
  // Hent gjeldende brukersesjon
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  // Sjekk om brukeren er logget inn
  if (sessionError || !session || !session.user) {
    console.error("Authentication error:", sessionError || "No active session");
    return NextResponse.json(
      { error: "Du må være logget inn for å utføre denne handlingen" },
      { status: 401 }
    );
  }
  
  // Hent bruker-ID fra sesjonen
  const userId = session.user.id;

  try {
    // Generer en unik token for sporing
    const token = nanoid(10);

    // 1. Lagre e-post i Supabase først for å få ID, inkluder user_id
    const { data: emailData, error: insertError } = await adminSupabase
      .from("sent_emails")
      .insert([{
        name,
        email,
        review_link: reviewLink,
        status: "SENT",
        sent_at: new Date().toISOString(),
        token: token,
        user_id: userId
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Error saving email record:", insertError);
      return NextResponse.json(
        { error: "Feil ved lagring av e-post: " + insertError.message },
        { status: 500 }
      );
    }

    // Hent ID fra den nylig opprettede raden
    const emailId = emailData?.id;
    if (!emailId) {
      throw new Error("Kunne ikke hente ID for den lagrede e-posten");
    }

    // 2. Lag en tracking URL med token
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const trackingUrl = `${baseUrl}/api/track-click?token=${token}`;

    // Sett standard emne og innhold hvis ikke angitt
    const emailSubject = subject || "Vi setter pris på din tilbakemelding! 🌟";
    
    // Standard e-post innhold som fallback
    let emailBody = body || `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333; margin-bottom: 20px;">Hei {{name}}!</h2>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Takk for at du valgte oss! Vi setter stor pris på om du kan gi oss en vurdering.</p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Det tar bare 30 sekunder og betyr mye for oss:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{link}}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">Gi din vurdering</a>
        </div>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Tusen takk for din hjelp!</p>
        <p style="color: #555; font-size: 16px; line-height: 1.5;">Med vennlig hilsen,<br>${process.env.EMAIL_FROM_NAME}</p>
      </div>
    `;

    // Erstatt variabler i malen
    emailBody = emailBody
      .replace(/{{name}}/g, name)
      .replace(/{{link}}/g, trackingUrl);

    // Lag en tekstversjon av e-posten for klienter som ikke støtter HTML
    let textVersion = `
Hei ${name}!

Takk for at du valgte oss! Vi setter stor pris på om du kan gi oss en vurdering.
Det tar bare 30 sekunder og betyr mye for oss.

Du kan gi din vurdering her: ${trackingUrl}

Tusen takk for din hjelp!

Med vennlig hilsen,
${process.env.EMAIL_FROM_NAME}
    `;

    // 3. Oppsett av e-posttransportør
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: Number(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for andre porter
      auth: {
        user: process.env.EMAIL_USERNAME!,
        pass: process.env.EMAIL_PASSWORD!,
      },
    });

    // 4. Send e-post med tracking URL
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: emailSubject,
      html: emailBody,
      text: textVersion,
    });

    return NextResponse.json({ status: "sent", id: emailId });
  } catch (error: any) {
    console.error("Error sending review request:", error);
    return NextResponse.json(
      { error: "Feil ved sending av vurderingsforespørsel: " + error.message },
      { status: 500 }
    );
  }
} 