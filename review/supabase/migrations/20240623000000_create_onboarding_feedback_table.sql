-- Create onboarding_feedback table
CREATE TABLE IF NOT EXISTS "public"."onboarding_feedback" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  "source" TEXT,
  "goal" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create RLS policies
ALTER TABLE "public"."onboarding_feedback" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own feedback"
  ON "public"."onboarding_feedback"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
  ON "public"."onboarding_feedback"
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON "public"."onboarding_feedback"
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE id = (SELECT current_setting('app.admin_id', TRUE))
  )); 