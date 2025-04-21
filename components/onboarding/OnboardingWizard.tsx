'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import steps
import WelcomeStep from './steps/WelcomeStep'
import CompanyInfoStep from './steps/CompanyInfoStep'
import { ReviewPlatformsStep, Platform } from './steps/ReviewPlatformsStep'
import CompleteStep from './steps/CompleteStep'

// Define the interface for onboarding data
export interface OnboardingData {
  companyName?: string
  contactName?: string
  industry?: string
  reviewPlatforms?: Platform[]
  reviewType?: 'google' | 'trustpilot' | 'custom'
  reviewLink?: string
}

export default function OnboardingWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // State
  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Next & previous step handlers
  const handleNextStep = () => setCurrentStep(prev => prev + 1)
  const handlePrevStep = () => setCurrentStep(prev => prev - 1)
  
  // Update onboarding data
  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }))
  }
  
  // Handle the company information step completion
  const handleCompanyInfoComplete = (data: Partial<OnboardingData>) => {
    updateOnboardingData(data)
    handleNextStep()
  }
  
  // Handle the platforms step completion
  const handlePlatformsComplete = async (platforms: Platform[]) => {
    setIsSubmitting(true)
    
    try {
      // Update onboarding data
      updateOnboardingData({ reviewPlatforms: platforms })
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('No authenticated user found')
      
      // Update the profiles table with selected platforms
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          onboarding_completed: true,
          connected_review_platforms: platforms,
          company_name: onboardingData.companyName,
          industry: onboardingData.industry,
          full_name: onboardingData.contactName
        })
      
      // Add dummy reviews in development mode
      if (process.env.NODE_ENV === 'development') {
        const dummyReviews = []
        
        // Generate 2-4 reviews for each selected platform
        for (const platform of platforms) {
          const reviewCount = Math.floor(Math.random() * 3) + 2
          
          for (let i = 0; i < reviewCount; i++) {
            const rating = Math.floor(Math.random() * 3) + 3 // 3-5 stars
            dummyReviews.push({
              user_id: user.id,
              platform,
              author_name: `Test User ${i + 1}`,
              rating,
              comment: `This is a test review for ${platform}. ${rating === 5 ? 'Excellent service!' : 'Very good experience.'}`,
              published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within past 30 days
              external_id: `dummy-${platform}-${user.id}-${i}`
            })
          }
        }
        
        if (dummyReviews.length > 0) {
          await supabase
            .from('external_reviews')
            .upsert(dummyReviews, { onConflict: 'external_id' })
        }
      }
      
      // Proceed to next step
      handleNextStep()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast({
        title: 'Error',
        description: 'Could not save your platform selections. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Handle onboarding completion
  const handleComplete = () => {
    router.push('/dashboard')
  }
  
  // Render current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNextStep} />
      case 1:
        return (
          <CompanyInfoStep 
            initialData={onboardingData}
            onComplete={handleCompanyInfoComplete}
            onBack={handlePrevStep}
          />
        )
      case 2:
        return (
          <ReviewPlatformsStep
            onComplete={handlePlatformsComplete}
            onBack={handlePrevStep}
            initialPlatforms={onboardingData.reviewPlatforms}
          />
        )
      case 3:
        return (
          <CompleteStep
            onboardingData={onboardingData}
            onComplete={handleComplete}
            onBack={handlePrevStep}
            isSubmitting={false}
          />
        )
      default:
        return null
    }
  }
  
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          {['Welcome', 'Company Info', 'Review Platforms', 'Complete'].map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                currentStep >= index ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <span className="text-xs mt-1">{step}</span>
            </div>
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {isSubmitting ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Processing your selection...</p>
              </div>
            ) : (
              renderStepContent()
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  )
} 