'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRight, Globe } from 'lucide-react'

interface ReviewStepProps {
  onNext: (reviewLink: string) => void
  onBack: () => void
}

export function ReviewStep({ onNext, onBack }: ReviewStepProps) {
  const [reviewLink, setReviewLink] = useState('')
  const [isUrlValid, setIsUrlValid] = useState(true)

  const validateUrl = (url: string) => {
    if (!url) return true
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!reviewLink) {
      setIsUrlValid(false)
      return
    }
    
    if (!validateUrl(reviewLink)) {
      setIsUrlValid(false)
      return
    }
    
    onNext(reviewLink)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-800">
          Send din første vurderingsforespørsel
        </h3>
        <p className="text-gray-600 mt-2">
          Send en personlig e-post som ber kunden gi deg en anmeldelse. Du kan justere innholdet senere.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="reviewLink" className="text-gray-700">Link til anmeldelsesside</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              id="reviewLink"
              type="text"
              value={reviewLink}
              onChange={(e) => {
                setReviewLink(e.target.value)
                setIsUrlValid(true)
              }}
              placeholder="https://g.page/bedrift/review"
              className={`pl-10 ${!isUrlValid ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
          </div>
          {!isUrlValid && (
            <p className="text-sm text-red-600 mt-1">
              Vennligst oppgi en gyldig URL til en anmeldelsesside
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Dette kan være en link til din Google Business-profil, Facebook-side, eller annen plattform der kunder kan gi deg anmeldelser.
          </p>
        </div>
        
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Tilbake
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Fortsett
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Tips:</strong> Du kan kopiere og lime inn lenken til din Google My Business-profil fra Google Maps eller søkeresultater.
        </p>
      </div>
    </div>
  )
} 