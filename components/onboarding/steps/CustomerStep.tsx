'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { CustomerData } from '@/types/onboarding' // Import from central file

interface CustomerStepProps {
  onNext: (customerData: CustomerData) => void
  onBack: () => void
}

export function CustomerStep({ onNext, onBack }: CustomerStepProps) {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: ''
  })

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {}

    if (!customerData.name.trim()) {
      newErrors.name = 'Navn er påkrevd'
    }

    if (!customerData.email.trim()) {
      newErrors.email = 'E-post er påkrevd'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Ugyldig e-post format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext({
        name: customerData.name,
        email: customerData.email
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCustomerData((prev) => ({ ...prev, [name]: value }))

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6 py-2"
    >
      <div className="text-center space-y-2 mb-4">
        <h3 className="text-xl font-medium text-gray-800">Legg til din første kunde</h3>
        <p className="text-gray-600">La oss gjøre det enkelt for deg å komme i gang</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Navn</Label>
          <Input
            id="name"
            name="name"
            placeholder="Ola Nordmann"
            value={customerData.name}
            onChange={handleChange}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="ola@bedrift.no"
            value={customerData.email}
            onChange={handleChange}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
        </div>

        <div className="flex items-center justify-between pt-6">
          <Button type="button" onClick={onBack} variant="outline" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake
          </Button>

          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            Fortsett
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
