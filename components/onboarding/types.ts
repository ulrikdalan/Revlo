// Common type definitions for onboarding components
export type ReviewType = 'google' | 'trustpilot' | 'custom'
export type ReviewPlatform = 'google' | 'facebook' | 'trustpilot' | 'yelp' | 'other'

export interface OnboardingData {
  companyName?: string
  contactName?: string
  industry?: string
  goal?: string
  source?: string
  reviewPlatforms?: ReviewPlatform[]
  customer?: {
    name: string
    email: string
  }
  reviewType?: ReviewType
  reviewLink?: string
} 