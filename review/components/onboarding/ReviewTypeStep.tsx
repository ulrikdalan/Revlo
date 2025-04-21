'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, ArrowLeft, MessageCircle, Star, Globe } from 'lucide-react'
import { motion } from 'framer-motion'

interface ReviewTypeStepProps {
  onNext: (reviewType: ReviewType) => void
  onBack: () => void
  initialValue?: ReviewType
}

export type ReviewType = 'google' | 'trustpilot' | 'custom'

interface ReviewTypeOption {
  id: ReviewType
  title: string
  description: string
  icon: React.ReactNode
}

export function ReviewTypeStep({ onNext, onBack, initialValue }: ReviewTypeStepProps) {
  const [selectedType, setSelectedType] = useState<ReviewType | undefined>(initialValue)

  const reviewTypeOptions: ReviewTypeOption[] = [
    {
      id: 'google',
      title: 'Google Anmeldelser',
      description: 'Få kunder til å gi anmeldelser på Google som øker din synlighet i søkeresultater.',
      icon: <Star className="h-8 w-8 text-yellow-500" />
    },
    {
      id: 'trustpilot',
      title: 'Trustpilot',
      description: 'Be om anmeldelser på Trustpilot for å styrke din bedrifts omdømme.',
      icon: <Star className="h-8 w-8 text-green-500" />
    },
    {
      id: 'custom',
      title: 'Egendefinert',
      description: 'Sett opp en tilpasset anmeldelsesløsning for din egen nettside eller annen plattform.',
      icon: <Globe className="h-8 w-8 text-blue-500" />
    }
  ]

  const handleContinue = () => {
    if (selectedType) {
      onNext(selectedType)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6 py-2"
    >
      <div className="text-center space-y-2">
        <h3 className="text-xl font-medium text-gray-800">
          Hvilken type anmeldelser vil du samle?
        </h3>
        <p className="text-gray-600">
          Velg plattformen som passer best for din bedrift.
        </p>
      </div>

      <div className="grid gap-4">
        {reviewTypeOptions.map((option) => (
          <Card 
            key={option.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedType === option.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedType(option.id)}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {option.icon}
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-gray-900">{option.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{option.description}</p>
              </div>
              <div className="flex-shrink-0 self-center">
                <div 
                  className={`w-5 h-5 rounded-full border ${
                    selectedType === option.id 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300'
                  } flex items-center justify-center`}
                >
                  {selectedType === option.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
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
          onClick={handleContinue}
          disabled={!selectedType}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Fortsett
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
} 