-- Legg til user_id-kolonne hvis den ikke allerede finnes
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'sent_emails' AND column_name = 'user_id'
  ) THEN
    -- Legg til user_id-kolonne
    ALTER TABLE sent_emails ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Oppdater eksisterende rader til å ha en standard bruker-ID hvis det finnes noen
    -- (Dette er for å håndtere eksisterende data)
    UPDATE sent_emails
    SET user_id = (SELECT id FROM auth.users LIMIT 1)
    WHERE user_id IS NULL;
  END IF;
END $$; 