-- Opprett review_templates-tabell
CREATE TABLE IF NOT EXISTS review_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Lag en indeks på user_id-feltet for raskere søk
CREATE INDEX IF NOT EXISTS review_templates_user_id_idx ON review_templates (user_id);

-- Sett opp RLS (Row Level Security) for tabellen
ALTER TABLE review_templates ENABLE ROW LEVEL SECURITY;

-- Lag en policy som gir tilgang for brukere til å se kun sine egne maler
CREATE POLICY "Users can view their own templates" 
  ON review_templates FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir brukere tilgang til å sette inn sine egne maler
CREATE POLICY "Users can insert their own templates" 
  ON review_templates FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Lag en policy som gir brukere tilgang til å oppdatere sine egne maler
CREATE POLICY "Users can update their own templates" 
  ON review_templates FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir brukere tilgang til å slette sine egne maler
CREATE POLICY "Users can delete their own templates" 
  ON review_templates FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir serviceroller tilgang til alle maler (for admin-funksjoner)
CREATE POLICY "Service role has full access to templates" 
  ON review_templates FOR ALL 
  TO service_role
  USING (true); 