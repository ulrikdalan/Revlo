export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string | null;
          onboarding_completed: boolean | null;
          connected_review_platforms: string[] | null;
        };
        Insert: {
          id: string;
          created_at?: string | null;
          onboarding_completed?: boolean | null;
          connected_review_platforms?: string[] | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          onboarding_completed?: boolean | null;
          connected_review_platforms?: string[] | null;
        };
      };
    };
  };
}

