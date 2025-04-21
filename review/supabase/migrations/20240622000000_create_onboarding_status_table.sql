-- Create onboarding_status table
CREATE TABLE IF NOT EXISTS "public"."onboarding_status" (
  "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  "completed_at" TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create RLS policies
ALTER TABLE "public"."onboarding_status" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own onboarding status"
  ON "public"."onboarding_status"
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding status"
  ON "public"."onboarding_status"
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.onboarding_status (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_onboarding ON auth.users;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_onboarding(); 