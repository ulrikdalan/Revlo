'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export interface ReviewTypeStepProps {
  onNext: (selectedPlatforms: string[]) => void
  onBack: () => void
}

const reviewPlatforms = [
  {
    id: 'google',
    title: 'Google',
    description: 'Connect with Google Business reviews',
    icon: (
      <Image
        src="/images/google.svg"
        alt="Google"
        width={32}
        height={32}
        className="text-[#4285F4]"
      />
    ),
  },
  {
    id: 'trustpilot',
    title: 'Trustpilot',
    description: 'Connect with Trustpilot reviews',
    icon: (
      <Image
        src="/trustpilot.svg"
        alt="Trustpilot"
        width={32}
        height={32}
      />
    ),
  },
  {
    id: 'yelp',
    title: 'Yelp',
    description: 'Connect with Yelp reviews',
    icon: (
      <Image
        src="/yelp.svg"
        alt="Yelp"
        width={32}
        height={32}
      />
    ),
  },
]

export function ReviewTypeStep({ onNext, onBack }: ReviewTypeStepProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleContinue = () => {
    if (selectedPlatforms.length > 0) {
      onNext(selectedPlatforms)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Connect review platforms</h1>
        <p className="text-muted-foreground">
          Select the review platforms you want to connect with your account.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviewPlatforms.map((platform) => (
          <Card
            key={platform.id}
            className={`cursor-pointer transition-all ${
              selectedPlatforms.includes(platform.id)
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => togglePlatform(platform.id)}
          >
            <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 flex items-center justify-center">
                {platform.icon}
              </div>
              <div>
                <h3 className="font-medium text-lg">{platform.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {platform.description}
                </p>
              </div>
              {selectedPlatforms.includes(platform.id) && (
                <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlatforms.length === 0 && (
        <div className="flex items-center gap-2 text-amber-500">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Please select at least one platform</span>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button 
          onClick={handleContinue} 
          disabled={selectedPlatforms.length === 0}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
} 