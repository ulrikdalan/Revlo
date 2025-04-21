-- Opprett external_reviews-tabell
CREATE TABLE IF NOT EXISTS external_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  author_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  external_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(external_id, platform)
);

-- Lag en indeks på user_id-feltet for raskere søk
CREATE INDEX IF NOT EXISTS external_reviews_user_id_idx ON external_reviews (user_id);
CREATE INDEX IF NOT EXISTS external_reviews_platform_idx ON external_reviews (platform);
CREATE INDEX IF NOT EXISTS external_reviews_published_at_idx ON external_reviews (published_at);

-- Sett opp RLS (Row Level Security) for tabellen
ALTER TABLE external_reviews ENABLE ROW LEVEL SECURITY;

-- Lag en policy som gir tilgang for brukere til å se kun sine egne anmeldelser
CREATE POLICY "Users can view their own external reviews"
  ON external_reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir brukere tilgang til å sette inn sine egne anmeldelser
CREATE POLICY "Users can insert their own external reviews"
  ON external_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Lag en policy som gir brukere tilgang til å oppdatere sine egne anmeldelser
CREATE POLICY "Users can update their own external reviews"
  ON external_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir brukere tilgang til å slette sine egne anmeldelser
CREATE POLICY "Users can delete their own external reviews"
  ON external_reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir serviceroller full tilgang til alle anmeldelser (for admin)
CREATE POLICY "Service role has full access to external reviews"
  ON external_reviews FOR ALL
  TO service_role
  USING (true); 