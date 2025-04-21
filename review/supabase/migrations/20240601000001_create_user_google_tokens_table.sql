-- Opprett user_google_tokens-tabell
CREATE TABLE IF NOT EXISTS user_google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  place_id TEXT,
  business_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Lag en indeks på user_id-feltet for raskere søk
CREATE INDEX IF NOT EXISTS user_google_tokens_user_id_idx ON user_google_tokens (user_id);

-- Sett opp RLS (Row Level Security) for tabellen
ALTER TABLE user_google_tokens ENABLE ROW LEVEL SECURITY;

-- Lag en policy som gir tilgang for brukere til å se kun sine egne tokens
CREATE POLICY "Users can view their own tokens"
  ON user_google_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Lag en policy som gir serviceroller full tilgang til alle tokens (for admin)
CREATE POLICY "Service role has full access to user tokens"
  ON user_google_tokens FOR ALL
  TO service_role
  USING (true); 