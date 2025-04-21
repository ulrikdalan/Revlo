-- Legg til reminder_sent_at-kolonne hvis den ikke allerede finnes
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sent_emails' AND column_name = 'reminder_sent_at'
  ) THEN
    ALTER TABLE sent_emails ADD COLUMN reminder_sent_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Oppdatere policy for å tillate oppdatering av data for service_role hvis den ikke allerede finnes
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'sent_emails' AND policyname = 'Service role can update sent_emails'
  ) THEN
    CREATE POLICY "Service role can update sent_emails" 
      ON sent_emails FOR UPDATE 
      TO service_role
      USING (true);
  END IF;
END $$; 