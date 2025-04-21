-- Legg til token-kolonne hvis den ikke allerede finnes
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sent_emails' AND column_name = 'token'
  ) THEN
    ALTER TABLE sent_emails ADD COLUMN token TEXT UNIQUE;
  END IF;
END $$; 