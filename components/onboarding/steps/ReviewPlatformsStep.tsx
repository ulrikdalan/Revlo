'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Search, ThumbsUp, Star, MessageCircle, HelpCircle } from 'lucide-react'
import { ReviewPlatform } from '@/types/onboarding'

interface ReviewPlatformsStepProps {
  onComplete: (platforms: ReviewPlatform[]) => void
  onBack: () => void
  initialPlatforms?: ReviewPlatform[]
}

export function ReviewPlatformsStep({ 
  onComplete, 
  onBack, 
  initialPlatforms = []
}: ReviewPlatformsStepProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<ReviewPlatform[]>(initialPlatforms)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const platforms = [
    {
      id: 'google' as ReviewPlatform,
      name: 'Google Reviews',
      logo: '/images/google.svg',
      fallbackIcon: <Search className="h-6 w-6 text-blue-500" />
    },
    {
      id: 'facebook' as ReviewPlatform,
      name: 'Facebook',
      logo: '/images/facebook.svg',
      fallbackIcon: <ThumbsUp className="h-6 w-6 text-blue-600" />
    },
    {
      id: 'trustpilot' as ReviewPlatform,
      name: 'Trustpilot',
      logo: '/images/trustpilot.svg',
      fallbackIcon: <Star className="h-6 w-6 text-green-500" />
    },
    {
      id: 'yelp' as ReviewPlatform,
      name: 'Yelp',
      logo: '/images/yelp.svg',
      fallbackIcon: <MessageCircle className="h-6 w-6 text-red-600" />
    },
    {
      id: 'other' as ReviewPlatform,
      name: 'Other',
      fallbackIcon: <HelpCircle className="h-6 w-6 text-gray-500" />
    }
  ]

  const togglePlatform = (platform: ReviewPlatform) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        return prev.filter(p => p !== platform)
      } else {
        return [...prev, platform]
      }
    })
  }

  const handleImageError = (platformId: string) => {
    setImageErrors(prev => ({ ...prev, [platformId]: true }))
  }

  const handleContinue = () => {
    if (selectedPlatforms.length > 0) {
      onComplete(selectedPlatforms)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Velg dine anmeldelsesplattformer</h2>
        <p className="text-muted-foreground">
          Velg plattformene du vil samle og administrere anmeldelser fra.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {platforms.map((platform) => (
          <Card
            key={platform.id}
            className={`p-4 cursor-pointer hover:border-primary transition-colors ${
              selectedPlatforms.includes(platform.id) ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => togglePlatform(platform.id)}
          >
            <div className="flex flex-col items-center space-y-3 p-2">
              {platform.logo && !imageErrors[platform.id] ? (
                <div className="h-12 w-12 relative">
                  <Image
                    src={platform.logo}
                    alt={`${platform.name} logo`}
                    width={48}
                    height={48}
                    className="object-contain"
                    onError={() => handleImageError(platform.id)}
                  />
                </div>
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-muted rounded-full">
                  {platform.fallbackIcon}
                </div>
              )}
              <span className="font-medium">{platform.name}</span>
              {selectedPlatforms.includes(platform.id) && (
                <CheckCircle className="h-5 w-5 text-primary absolute top-2 right-2" />
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Tilbake
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedPlatforms.length === 0}
        >
          Fortsett
        </Button>
      </div>
    </motion.div>
  )
}
