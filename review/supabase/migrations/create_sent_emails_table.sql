-- Opprett sent_emails-tabell
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  review_link TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lag en indeks på email-feltet for raskere søk
CREATE INDEX IF NOT EXISTS sent_emails_email_idx ON sent_emails (email);

-- Lag en indeks på sent_at-feltet for raskere sortering på dato
CREATE INDEX IF NOT EXISTS sent_emails_sent_at_idx ON sent_emails (sent_at);

-- Sett opp RLS (Row Level Security) for tabellen
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

-- Lag en policy som gir tilgang til autentiserte brukere
CREATE POLICY "Authenticated users can view sent_emails" 
  ON sent_emails FOR SELECT 
  TO authenticated
  USING (true);

-- Lag en policy som gir serviceroller tilgang til å sette inn data
CREATE POLICY "Service role can insert into sent_emails" 
  ON sent_emails FOR INSERT 
  TO service_role
  USING (true);

-- Lag en policy som gir serviceroller tilgang til å oppdatere data
CREATE POLICY "Service role can update sent_emails" 
  ON sent_emails FOR UPDATE 
  TO service_role
  USING (true); 