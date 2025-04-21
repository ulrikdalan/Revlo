'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowRightCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { SelectValue, SelectTrigger, SelectContent, SelectItem, Select } from '@/components/ui/select'
import { OnboardingData } from './OnboardingWizard'

interface WelcomeStepProps {
  onNext: (data: Pick<OnboardingData, 'goal' | 'source' | 'industry'>) => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const [goal, setGoal] = useState<string>('')
  const [source, setSource] = useState<string>('')
  const [industry, setIndustry] = useState<string>('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}
    
    if (!goal) {
      newErrors.goal = 'Vennligst velg et mål'
    }
    
    if (!source) {
      newErrors.source = 'Vennligst velg et alternativ'
    }
    
    if (!industry) {
      newErrors.industry = 'Vennligst velg en bransje'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onNext({ goal, source, industry })
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 py-2"
    >
      <div className="text-center mb-8">
        <motion.img 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          src="/logo.png" 
          alt="Revlo Logo" 
          className="w-24 h-24 object-contain mx-auto mb-6"
          onError={(e) => e.currentTarget.style.display = 'none'} 
        />
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Velkommen til Revlo!
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Vi hjelper deg få flere og bedre kundeanmeldelser – helt automatisk.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="goal">Hva er målet ditt med Revlo?</Label>
          <Select value={goal} onValueChange={setGoal}>
            <SelectTrigger id="goal" className={errors.goal ? 'border-red-500' : ''}>
              <SelectValue placeholder="Velg ditt mål" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="more_reviews">Få flere anmeldelser</SelectItem>
              <SelectItem value="increase_visibility">Øke synlighet</SelectItem>
              <SelectItem value="increase_sales">Øke salg</SelectItem>
              <SelectItem value="build_reputation">Bygge omdømme</SelectItem>
            </SelectContent>
          </Select>
          {errors.goal && <p className="text-red-500 text-sm">{errors.goal}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="source">Hvordan hørte du om oss?</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger id="source" className={errors.source ? 'border-red-500' : ''}>
              <SelectValue placeholder="Velg et alternativ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommendation">Anbefaling</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="social_media">Sosiale medier</SelectItem>
              <SelectItem value="other">Annet</SelectItem>
            </SelectContent>
          </Select>
          {errors.source && <p className="text-red-500 text-sm">{errors.source}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="industry">Hvilken bransje er du i?</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="industry" className={errors.industry ? 'border-red-500' : ''}>
              <SelectValue placeholder="Velg din bransje" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retail">Detaljhandel</SelectItem>
              <SelectItem value="restaurant">Restaurant/Café</SelectItem>
              <SelectItem value="hotel">Hotell/Overnatting</SelectItem>
              <SelectItem value="healthcare">Helse/Velvære</SelectItem>
              <SelectItem value="professional">Konsulenttjenester</SelectItem>
              <SelectItem value="construction">Bygg/Anlegg</SelectItem>
              <SelectItem value="automotive">Bil/Transport</SelectItem>
              <SelectItem value="education">Utdanning/Opplæring</SelectItem>
              <SelectItem value="tech">IT/Teknologi</SelectItem>
              <SelectItem value="other">Annet</SelectItem>
            </SelectContent>
          </Select>
          {errors.industry && <p className="text-red-500 text-sm">{errors.industry}</p>}
        </div>
        
        <Button 
          type="submit" 
          className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
        >
          Neste
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </form>
    </motion.div>
  )
} 