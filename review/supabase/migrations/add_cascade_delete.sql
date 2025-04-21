-- Hvis user_id-frekvensnøkkelen allerede eksisterer, fjern den først og opprett på nytt med CASCADE DELETE
DO $$ 
BEGIN 
  -- Fjern eksisterende constraint hvis den finnes
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sent_emails_user_id_fkey' 
    AND table_name = 'sent_emails'
  ) THEN
    ALTER TABLE sent_emails DROP CONSTRAINT sent_emails_user_id_fkey;
  END IF;

  -- Legg til constraint på nytt med CASCADE DELETE
  ALTER TABLE sent_emails 
  ADD CONSTRAINT sent_emails_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;
END $$; 