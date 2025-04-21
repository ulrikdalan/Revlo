'use client'

import { Button } from '@/components/ui/button'
import { Check, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { OnboardingData } from '@/types/onboarding'

interface CompleteStepProps {
  onboardingData: OnboardingData
  onComplete: () => void
  onBack: () => void
  isSubmitting: boolean
}

export default function CompleteStep({
  onboardingData,
  onComplete,
  onBack,
  isSubmitting
}: CompleteStepProps) {
  // Helper function to format review platforms nicely
  const formatPlatforms = (platforms?: string[]) => {
    if (!platforms || platforms.length === 0) {
      return 'Ingen valgt'
    }
    
    // Capitalize first letter of each platform
    return platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Oppsummering</h2>
        <p className="text-gray-600 mt-1">
          Takk for at du fullførte onboarding. Her er informasjonen vi har samlet:
        </p>
      </div>

      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="bg-green-100 rounded-full p-1 mt-0.5">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-700">Bedriftsinformasjon</p>
            <p className="text-sm text-gray-600">
              {onboardingData.companyName} - {onboardingData.industry}
            </p>
            <p className="text-sm text-gray-600">
              Kontakt: {onboardingData.contactName}
            </p>
          </div>
        </div>

        {onboardingData.customer && (
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 mt-0.5">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Kundeinformasjon</p>
              <p className="text-sm text-gray-600">
                {onboardingData.customer.name} - {onboardingData.customer.email}
              </p>
            </div>
          </div>
        )}

        {onboardingData.reviewPlatforms && onboardingData.reviewPlatforms.length > 0 && (
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 mt-0.5">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Anmeldelsesplattformer</p>
              <p className="text-sm text-gray-600">
                {formatPlatforms(onboardingData.reviewPlatforms)}
              </p>
            </div>
          </div>
        )}

        {onboardingData.reviewType && (
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 mt-0.5">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Anmeldelsestype</p>
              <p className="text-sm text-gray-600">
                {onboardingData.reviewType === 'google' && 'Google anmeldelser'}
                {onboardingData.reviewType === 'trustpilot' && 'Trustpilot'}
                {onboardingData.reviewType === 'custom' && 'Egen lenke'}
              </p>
            </div>
          </div>
        )}

        {onboardingData.reviewLink && (
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 mt-0.5">
              <Check className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-700">Anmeldelseslenke</p>
              <p className="text-sm text-gray-600 break-all">
                {onboardingData.reviewLink}
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600">
          Du kan endre disse innstillingene senere i din profil.
        </p>
      </div>

      <div className="pt-4 flex justify-between">
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake
        </Button>
        
        <Button
          type="button"
          onClick={onComplete}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fullfører...
            </>
          ) : (
            <>
              Til dashbordet
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  )
} 