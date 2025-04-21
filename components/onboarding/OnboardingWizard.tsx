'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import steps from steps directory
import WelcomeStep from './steps/WelcomeStep'
import CompanyInfoStep from './steps/CompanyInfoStep'
import { CustomerStep } from './steps/CustomerStep'
import { ReviewTypeStep } from './steps/ReviewTypeStep'
import ReviewLinkStep from './steps/ReviewLinkStep'
import { ReviewPlatformsStep } from './steps/ReviewPlatformsStep'
import CompleteStep from './steps/CompleteStep'

// Import types from the central type definition file
import { OnboardingData, ReviewType, ReviewPlatform, CustomerData } from '@/types/onboarding'

export default function OnboardingWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNextStep = () => setCurrentStep(prev => prev + 1)
  const handlePrevStep = () => setCurrentStep(prev => prev - 1)

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }))
  }

  const handleCompanyInfoComplete = (data: Partial<OnboardingData>) => {
    updateOnboardingData(data)
    handleNextStep()
  }

  const handleCustomerComplete = (customerData: CustomerData) => {
    updateOnboardingData({ customer: customerData })
    handleNextStep()
  }

  const handleReviewTypeComplete = (reviewType: ReviewType) => {
    updateOnboardingData({ reviewType })
    handleNextStep()
  }

  const handleReviewLinkComplete = (reviewLink: string) => {
    updateOnboardingData({ reviewLink })
    handleNextStep()
  }

  const handlePlatformsComplete = async (platforms: ReviewPlatform[]) => {
    setIsSubmitting(true)

    try {
      updateOnboardingData({ reviewPlatforms: platforms })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user found')

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

      if (process.env.NODE_ENV === 'development') {
        const dummyReviews = []

        for (const platform of platforms) {
          const reviewCount = Math.floor(Math.random() * 3) + 2

          for (let i = 0; i < reviewCount; i++) {
            const rating = Math.floor(Math.random() * 3) + 3
            dummyReviews.push({
              user_id: user.id,
              platform,
              author_name: `Test User ${i + 1}`,
              rating,
              comment: `This is a test review for ${platform}. ${rating === 5 ? 'Excellent service!' : 'Very good experience.'}`,
              published_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
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

  const handleComplete = async () => {
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user found')

      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          onboarding_completed: true,
          company_name: onboardingData.companyName,
          industry: onboardingData.industry,
          full_name: onboardingData.contactName
        })

      router.push('/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast({
        title: 'Error',
        description: 'Could not complete onboarding. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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
          <CustomerStep
            onNext={handleCustomerComplete}
            onBack={handlePrevStep}
          />
        )
      case 3:
        return (
          <ReviewTypeStep
            onNext={handleReviewTypeComplete}
            onBack={handlePrevStep}
            initialValue={onboardingData.reviewType}
          />
        )
      case 4:
        return (
          <ReviewLinkStep
            onNext={handleReviewLinkComplete}
            onBack={handlePrevStep}
            reviewType={onboardingData.reviewType || 'custom'}
            initialValue={onboardingData.reviewLink}
          />
        )
      case 5:
        return (
          <ReviewPlatformsStep
            onComplete={handlePlatformsComplete}
            onBack={handlePrevStep}
            initialPlatforms={onboardingData.reviewPlatforms}
          />
        )
      case 6:
        return (
          <CompleteStep
            onboardingData={onboardingData}
            onComplete={handleComplete}
            onBack={handlePrevStep}
            isSubmitting={isSubmitting}
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
          {['Welcome', 'Company Info', 'Customer', 'Review Type', 'Review Link', 'Platforms', 'Complete'].map((step, index) => (
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
                <p className="text-lg">Processing your information...</p>
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
