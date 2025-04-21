'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import { ReviewType } from '@/types/onboarding'

interface ReviewLinkStepProps {
  onNext: (reviewLink: string) => void
  onBack: () => void
  reviewType: ReviewType
  initialValue?: string
}

export default function ReviewLinkStep({
  onNext,
  onBack,
  reviewType,
  initialValue = ''
}: ReviewLinkStepProps) {
  const [hasReviewLink, setHasReviewLink] = useState(Boolean(initialValue))
  const [reviewLink, setReviewLink] = useState(initialValue)
  const [error, setError] = useState('')

  const validateAndContinue = () => {
    setError('')
    if (hasReviewLink && reviewLink.trim()) {
      try {
        new URL(reviewLink)
        onNext(reviewLink)
      } catch (e) {
        setError('Vennligst oppgi en gyldig URL (inkluder https://)')
      }
    } else {
      onNext('')
    }
  }

  const getTitle = () => {
    switch (reviewType) {
      case 'google': return 'Legg til din Google-anmeldelseslenke'
      case 'trustpilot': return 'Legg til din Trustpilot-anmeldelseslenke'
      case 'custom': return 'Legg til din anmeldelseslenke'
      default: return 'Legg til anmeldelseslenke'
    }
  }

  const getDescription = () => {
    switch (reviewType) {
      case 'google': return 'Lenken hvor kundene dine kan legge igjen en Google-anmeldelse'
      case 'trustpilot': return 'Lenken hvor kundene dine kan legge igjen en Trustpilot-anmeldelse'
      case 'custom': return 'Lenken hvor kundene dine kan legge igjen en anmeldelse'
      default: return 'Lenken hvor kundene dine kan legge igjen en anmeldelse'
    }
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
        <h2 className="text-2xl font-semibold text-gray-800">{getTitle()}</h2>
        <p className="text-gray-600 mt-1">
          {getDescription()}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox 
            id="hasReviewLink" 
            checked={hasReviewLink}
            onCheckedChange={(checked: boolean | 'indeterminate') => setHasReviewLink(checked === true)}
            className="mt-1"
          />
          <Label 
            htmlFor="hasReviewLink" 
            className="text-sm font-medium leading-none cursor-pointer"
          >
            Jeg har en anmeldelsesside jeg ønsker å bruke (f.eks. Google, Trustpilot, Yelp)
          </Label>
        </div>

        {hasReviewLink && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="reviewLink">Anmeldelseslenke</Label>
            <div className="relative">
              <Input
                id="reviewLink"
                placeholder="https://g.page/bedrift/review"
                value={reviewLink}
                onChange={(e) => setReviewLink(e.target.value)}
                className={error ? 'border-red-500' : ''}
              />
              <ExternalLink className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-sm text-gray-500 mt-1">
              Du kan legge til eller endre denne lenken senere fra innstillinger.
            </p>
          </div>
        )}

        {hasReviewLink && reviewType !== 'custom' && (
          <div className="pt-2 text-sm text-gray-500">
            <p>Tips:</p>
            {reviewType === 'google' && (
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Gå til Google My Business</li>
                <li>Velg "Del anmeldelsesform" og kopier lenken</li>
              </ul>
            )}
            {reviewType === 'trustpilot' && (
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Gå til din Trustpilot profil</li>
                <li>Kopier URL-en fra nettleseren</li>
              </ul>
            )}
          </div>
        )}
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
          onClick={validateAndContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Fortsett
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
