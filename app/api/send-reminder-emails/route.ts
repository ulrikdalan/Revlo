import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import nodemailer from "nodemailer";
import { cookies } from "next/headers";

// Funksjon for å opprette Supabase-klient med cookies
function createServerClient() {
  return createServerComponentClient({ 
    cookies 
  });
}

// Admin-klient med service role for databasetilgang
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Funksjon for å hente kunder som trenger påminnelse for en spesifikk bruker
async function getCustomersNeedingReminder(userId: string) {
  // Bruk den nye SQL-funksjonen get_pending_reminders
  const { data, error } = await adminSupabase
    .rpc('get_pending_reminders')
    .eq("user_id", userId);
  
  if (error) {
    console.error("Error fetching customers needing reminder:", error);
    throw error;
  }
  
  return data || [];
}

// Funksjon for å hente alle kunder som trenger påminnelse (for cron job)
async function getAllCustomersNeedingReminder() {
  // Bruk den nye SQL-funksjonen get_pending_reminders
  const { data, error } = await adminSupabase
    .rpc('get_pending_reminders');
  
  if (error) {
    console.error("Error fetching customers needing reminder:", error);
    throw error;
  }
  
  return data || [];
}

// Funksjon for å sende påminnelse e-post
async function sendReminderEmail(customer: any) {
  // Lag en tracking URL med token eller review_link
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  let trackingUrl = customer.review_link;
  
  // Hvis vi har en token, bruk tracking URL
  if (customer.token) {
    trackingUrl = `${baseUrl}/api/track-click?token=${customer.token}`;
  }

  if (!trackingUrl) {
    throw new Error("No review link or token available for tracking");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // true for 465, false for andre porter
    auth: {
      user: process.env.EMAIL_USERNAME!,
      pass: process.env.EMAIL_PASSWORD!,
    },
  });

  // Erstatt variabler i e-postmalen
  let emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333; margin-bottom: 20px;">Hei ${customer.name || "der"}!</h2>
      <p style="color: #555; font-size: 16px; line-height: 1.5;">Vi sendte deg en forespørsel om tilbakemelding for noen dager siden, men har ikke hørt fra deg ennå.</p>
      <p style="color: #555; font-size: 16px; line-height: 1.5;">Vi setter stor pris på om du kan ta et øyeblikk til å dele din erfaring med oss.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${trackingUrl}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Gi din vurdering</a>
      </div>
      <p style="color: #555; font-size: 16px; line-height: 1.5;">Takk for din tid!</p>
      <p style="color: #555; font-size: 16px; line-height: 1.5;">Med vennlig hilsen,<br>${process.env.EMAIL_FROM_NAME}</p>
    </div>
  `;

  // Lag en tekstversjon av e-posten for klienter som ikke støtter HTML
  let textVersion = `
Hei ${customer.name || "der"}!

Vi sendte deg en forespørsel om tilbakemelding for noen dager siden, men har ikke hørt fra deg ennå.
Vi setter stor pris på om du kan ta et øyeblikk til å dele din erfaring med oss.

Gi din vurdering her: ${trackingUrl}

Takk for din tid!

Med vennlig hilsen,
${process.env.EMAIL_FROM_NAME}
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customer.email,
    subject: "Påminnelse: Vi ønsker fortsatt din tilbakemelding! 🌟",
    html: emailBody,
    text: textVersion,
  });
}

// Funksjon for å oppdatere status etter sendt påminnelse
async function updateReminderStatus(id: string) {
  const currentTimestamp = new Date().toISOString();
  const { error } = await adminSupabase
    .from("sent_emails")
    .update({ 
      status: "REMINDER_SENT", 
      reminder_sent_at: currentTimestamp 
    })
    .eq("id", id);
  
  if (error) {
    console.error(`Error updating status for ID ${id}:`, error);
    throw error;
  }
  
  return { id, timestamp: currentTimestamp };
}

// API-rute for manuelt kall eller cron-jobb
export async function GET(req: NextRequest) {
  console.log("Reminder email check started at:", new Date().toISOString());
  
  try {
    // Verifiser miljøvariabler
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      console.error("Missing email credentials in environment variables");
      return NextResponse.json(
        { error: "E-postinnstillinger mangler i miljøvariablene" },
        { status: 500 }
      );
    }
    
    // Cron jobs kjører uten en autentisert bruker, så vi må bruke service role key
    // for å kjøre jobben for alle brukere
    const isCronJob = req.headers.get("x-vercel-cron") === "true";
    
    if (isCronJob) {
      console.log("Running as cron job - processing all users");
      return await processCronJob();
    } else {
      console.log("Running as manual API call - checking user session");
      return await processManualRequest();
    }
  } catch (error: any) {
    console.error("Unhandled error in reminder process:", error);
    return NextResponse.json(
      { error: "Systemfeil ved behandling av påminnelser", message: error.message },
      { status: 500 }
    );
  }
}

// POST-metode for manuell triggerløsning via et skjema
export async function POST(req: NextRequest) {
  return GET(req);
}

// Håndterer cron-jobber som kjører for alle brukere
async function processCronJob() {
  try {
    // Bruk den nye SQL-funksjonen for å få alle kunder som trenger påminnelse
    const allPendingReminders = await getAllCustomersNeedingReminder();
    
    // Grupperinger for rapportering
    const results = {
      totalPendingReminders: allPendingReminders.length,
      sentEmails: 0,
      errors: 0,
      userResults: {} as Record<string, any>
    };
    
    if (allPendingReminders.length === 0) {
      console.log("No pending reminders found");
      return NextResponse.json({
        message: "No reminders needed",
        totalPendingReminders: 0
      });
    }
    
    // Grupper påminnelser etter bruker-ID for rapportering
    for (const reminder of allPendingReminders) {
      const userId = reminder.user_id;
      
      if (!results.userResults[userId]) {
        results.userResults[userId] = {
          total: 0,
          sent: 0,
          errors: 0,
          details: []
        };
      }
      
      results.userResults[userId].total++;
      
      try {
        await sendReminderEmail(reminder);
        await updateReminderStatus(reminder.id);
        
        results.sentEmails++;
        results.userResults[userId].sent++;
        results.userResults[userId].details.push({
          id: reminder.id,
          email: reminder.email,
          status: "success"
        });
        
        console.log(`Successfully sent reminder to ${reminder.email}`);
      } catch (error: any) {
        console.error(`Error sending reminder to ${reminder.email}:`, error);
        results.errors++;
        results.userResults[userId].errors++;
        results.userResults[userId].details.push({
          id: reminder.id,
          email: reminder.email,
          status: "error",
          message: error.message
        });
      }
    }
    
    console.log("Cron job completed with results:", {
      totalPendingReminders: results.totalPendingReminders,
      sentEmails: results.sentEmails,
      errors: results.errors
    });
    
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Error in cron job processing:", error);
    return NextResponse.json(
      { error: "Failed to process cron job", message: error.message },
      { status: 500 }
    );
  }
}

// Håndterer manuelle API-kall fra en innlogget bruker
async function processManualRequest() {
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
  
  // Prosesser påminnelser for den innloggede brukeren
  try {
    const userId = session.user.id;
    const result = await processUserReminders(userId);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error processing manual request:", error);
    return NextResponse.json(
      { error: "Kunne ikke behandle påminnelser", message: error.message },
      { status: 500 }
    );
  }
}

// Prosesserer påminnelser for en enkelt bruker
async function processUserReminders(userId: string) {
  const customersNeedingReminder = await getCustomersNeedingReminder(userId);
  
  console.log(`Processing ${customersNeedingReminder.length} reminders for user ${userId}`);
  
  if (customersNeedingReminder.length === 0) {
    return { message: "No reminders needed", total: 0, sent: 0, errors: 0 };
  }
  
  const results = {
    total: customersNeedingReminder.length,
    sent: 0,
    errors: 0,
    details: [] as any[]
  };
  
  // Send påminnelser og oppdater status
  for (const customer of customersNeedingReminder) {
    try {
      await sendReminderEmail(customer);
      await updateReminderStatus(customer.id);
      
      results.sent++;
      results.details.push({
        id: customer.id,
        email: customer.email,
        status: "success"
      });
      
      console.log(`Successfully sent reminder to ${customer.email}`);
    } catch (error: any) {
      console.error(`Error sending reminder to ${customer.email}:`, error);
      results.errors++;
      results.details.push({
        id: customer.id,
        email: customer.email,
        status: "error",
        message: error.message
      });
    }
  }
  
  return results;
} 