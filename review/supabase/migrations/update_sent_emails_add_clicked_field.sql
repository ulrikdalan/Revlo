-- Legg til clicked_at-kolonne hvis den ikke allerede finnes
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sent_emails' AND column_name = 'clicked_at'
  ) THEN
    ALTER TABLE sent_emails ADD COLUMN clicked_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$; 