// Central definitions for all onboarding-related types
export type ReviewType = 'google' | 'trustpilot' | 'custom'
export type ReviewPlatform = 'google' | 'facebook' | 'trustpilot' | 'yelp' | 'other'

export interface CustomerData {
  name: string
  email: string
  reviewLink?: string
}

export interface OnboardingData {
  companyName?: string
  contactName?: string
  industry?: string
  reviewPlatforms?: ReviewPlatform[]
  customer?: CustomerData
  reviewType?: ReviewType
  reviewLink?: string
} 