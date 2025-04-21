import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: NextRequest) {
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

    // Finn e-poster som trenger påminnelse:
    // - Ikke har clicked_at (ikke klikket)
    // - Ikke har reminder_sent_at (påminnelse ikke sendt ennå)
    // - Sendt for mer enn 2 dager siden
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    const { data: emailsNeedingReminder, error: fetchError } = await adminSupabase
      .from("sent_emails")
      .select("*")
      .eq("user_id", userId)
      .is("clicked_at", null)
      .is("reminder_sent_at", null)
      .lt("sent_at", twoDaysAgo.toISOString());
    
    if (fetchError) {
      console.error("Error fetching emails needing reminders:", fetchError);
      return NextResponse.json(
        { error: fetchError.message || "Feil ved henting av e-poster" },
        { status: 500 }
      );
    }

    // Hvis ingen e-poster trenger påminnelse
    if (!emailsNeedingReminder || emailsNeedingReminder.length === 0) {
      return NextResponse.json({ sentCount: 0, message: "Ingen påminnelser å sende" });
    }

    // Oppsett av e-posttransportør
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER,
      port: Number(process.env.EMAIL_PORT),
      secure: false, // true for 465, false for andre porter
      auth: {
        user: process.env.EMAIL_USERNAME!,
        pass: process.env.EMAIL_PASSWORD!,
      },
    });

    // Send påminnelser og oppdater databasen
    const reminderPromises = emailsNeedingReminder.map(async (email) => {
      try {
        // Lag en tracking URL med token
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const trackingUrl = `${baseUrl}/api/track-click?token=${email.token}`;

        // Send påminnelsesmail
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email.email,
          subject: "Påminnelse: Vi ønsker fortsatt din tilbakemelding! 🌟",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hei ${email.name}!</h2>
              <p style="color: #555; font-size: 16px; line-height: 1.5;">Vi ser at du ennå ikke har gitt oss en vurdering. Din tilbakemelding er veldig viktig for oss!</p>
              <p style="color: #555; font-size: 16px; line-height: 1.5;">Det tar bare 30 sekunder å gi en vurdering:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${trackingUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">Gi din vurdering</a>
              </div>
              <p style="color: #555; font-size: 16px; line-height: 1.5;">Tusen takk for din hjelp!</p>
              <p style="color: #555; font-size: 16px; line-height: 1.5;">Med vennlig hilsen,<br>${process.env.EMAIL_FROM_NAME}</p>
            </div>
          `,
          text: `
Hei ${email.name}!

Vi ser at du ennå ikke har gitt oss en vurdering. Din tilbakemelding er veldig viktig for oss!
Det tar bare 30 sekunder å gi en vurdering.

Du kan gi din vurdering her: ${trackingUrl}

Tusen takk for din hjelp!

Med vennlig hilsen,
${process.env.EMAIL_FROM_NAME}
          `,
        });

        // Oppdater reminder_sent_at i databasen
        const currentTime = new Date().toISOString();
        const { error: updateError } = await adminSupabase
          .from("sent_emails")
          .update({ reminder_sent_at: currentTime })
          .eq("id", email.id);

        if (updateError) {
          console.error(`Error updating reminder status for email ${email.id}:`, updateError);
          return { success: false, id: email.id, error: updateError.message };
        }

        return { success: true, id: email.id };
      } catch (error: any) {
        console.error(`Error sending reminder for email ${email.id}:`, error);
        return { success: false, id: email.id, error: error.message };
      }
    });

    // Vent på at alle påminnelser er sendt
    const results = await Promise.all(reminderPromises);
    const successCount = results.filter(r => r.success).length;

    // Returner resultatet
    return NextResponse.json({
      sentCount: successCount,
      totalCount: emailsNeedingReminder.length,
      message: `${successCount} av ${emailsNeedingReminder.length} påminnelser ble sendt`
    });
  } catch (error: any) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "En uventet feil oppstod: " + error.message },
      { status: 500 }
    );
  }
} 