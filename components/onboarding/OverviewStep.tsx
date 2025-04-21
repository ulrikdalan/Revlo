'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, Bell, BarChart2, AreaChart, Globe, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: <Bell className="h-10 w-10 text-blue-500" />,
    title: "Automatiske påminnelser",
    description: "Revlo sender automatiske påminnelser til kunder som ikke har svart, så du slipper å huske på det."
  },
  {
    icon: <AreaChart className="h-10 w-10 text-green-500" />,
    title: "Analyse og statistikk",
    description: "Få oversikt over dine anmeldelser og hvordan de påvirker din nettsynlighet og omdømme."
  },
  {
    icon: <Globe className="h-10 w-10 text-red-500" />,
    title: "Google-integrasjon",
    description: "Koble din Google My Business-konto for å synkronisere og svare på anmeldelser direkte."
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
}

interface OverviewStepProps {
  onComplete: () => void
  onBack: () => void
  isSubmitting: boolean
  error?: string | null
}

export function OverviewStep({ onComplete, onBack, isSubmitting, error }: OverviewStepProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        </motion.div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Du er klar!
        </h3>
        <p className="text-gray-600">
          Du kan nå sende din første vurderingsforespørsel, se statistikk og få full oversikt i dashbordet.
        </p>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={item}>
            <Card className="h-full border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-200">
              <CardContent className="p-5 flex items-start">
                <div className="shrink-0 mr-4">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-800 mb-1">{feature.title}</h4>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 text-blue-800">
        <p className="text-sm">
          <strong>Tips:</strong> Fra dashbordet kan du også importere eksisterende kundelister, opprette e-postmaler, og mye mer.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-red-800 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Tilbake
        </Button>
        
        <Button 
          onClick={onComplete} 
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fullfører...
            </>
          ) : (
            <>
              Fullfør og gå til dashboard
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 