'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CustomerStepProps {
  onNext: (data: { companyName: string; contactName: string; industry: string }) => void
  onBack: () => void
  initialData?: {
    companyName?: string
    contactName?: string
    industry?: string
  }
}

export default function CustomerStep({ onNext, onBack, initialData = {} }: CustomerStepProps) {
  const [companyName, setCompanyName] = useState(initialData.companyName || '')
  const [contactName, setContactName] = useState(initialData.contactName || '')
  const [industry, setIndustry] = useState(initialData.industry || '')
  const [errors, setErrors] = useState({
    companyName: '',
    contactName: '',
    industry: ''
  })

  const validateForm = () => {
    const newErrors = {
      companyName: companyName.trim() ? '' : 'Firmanavn er påkrevd',
      contactName: contactName.trim() ? '' : 'Kontaktperson er påkrevd',
      industry: industry.trim() ? '' : 'Bransje er påkrevd'
    }
    
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onNext({
        companyName: companyName.trim(),
        contactName: contactName.trim(),
        industry: industry.trim()
      })
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
        <h2 className="text-2xl font-semibold text-gray-800">Fortell oss om din bedrift</h2>
        <p className="text-gray-600 mt-1">
          Vi trenger litt informasjon for å tilpasse Revlo til din bedrift
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="companyName" className={cn(errors.companyName && "text-red-500")}>
            Firmanavn
          </Label>
          <Input
            id="companyName"
            placeholder="Bedriftens navn"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={cn(errors.companyName && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.companyName && (
            <p className="text-red-500 text-sm">{errors.companyName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName" className={cn(errors.contactName && "text-red-500")}>
            Kontaktperson
          </Label>
          <Input
            id="contactName"
            placeholder="Ditt navn"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className={cn(errors.contactName && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.contactName && (
            <p className="text-red-500 text-sm">{errors.contactName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry" className={cn(errors.industry && "text-red-500")}>
            Bransje
          </Label>
          <Input
            id="industry"
            placeholder="F.eks. Frisør, Restaurant, Eiendomsmegler"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className={cn(errors.industry && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.industry && (
            <p className="text-red-500 text-sm">{errors.industry}</p>
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
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Fortsett
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  )
} 