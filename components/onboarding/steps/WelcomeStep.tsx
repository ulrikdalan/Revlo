'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, MessageCircle, Star, ChartBar } from 'lucide-react'

interface WelcomeStepProps {
  onNext: () => void
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: <MessageCircle className="h-6 w-6 text-blue-500" />,
      title: 'Samle anmeldelser',
      description: 'Få flere anmeldelser fra fornøyde kunder ved å sende automatiske forespørsler.',
    },
    {
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      title: 'Forbedre omdømme',
      description: 'Bygge tillit og troverdighet gjennom kundeanmeldelser på tvers av plattformer.',
    },
    {
      icon: <ChartBar className="h-6 w-6 text-green-500" />,
      title: 'Innsikt og analyse',
      description: 'Få verdifull innsikt i kundenes opplevelser og ta databaserte beslutninger.',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Velkommen</h2>
        <p className="text-gray-600">
          La oss hjelpe deg med å samle flere gode anmeldelser for din bedrift
        </p>
      </div>

      <div className="grid gap-4 py-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex justify-end">
        <Button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Kom i gang
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
} 