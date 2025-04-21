-- Opprett google_accounts-tabell
CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  place_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Lag en indeks på user_id-feltet for raskere søk
CREATE INDEX IF NOT EXISTS google_accounts_user_id_idx ON google_accounts (user_id);

-- Sett opp RLS (Row Level Security) for tabellen
ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;

-- Lag en policy som gir tilgang for brukere til å se kun sine egne Google-kontoer
CREATE POLICY "Users can view their own Google accounts"
  ON google_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir serviceroller full tilgang til alle Google-kontoer
CREATE POLICY "Service role has full access to Google accounts"
  ON google_accounts FOR ALL
  TO service_role
  USING (true); 