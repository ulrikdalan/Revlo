'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Star, Users, ChartLine } from 'lucide-react'
import { motion } from 'framer-motion'

interface WelcomeStepProps {
  onNext: () => void
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      title: "Automatiserte forespørsler",
      description: "Send personlige forespørsler om anmeldelser til dine kunder og øk antallet 5-stjerners tilbakemeldinger."
    },
    {
      icon: <ChartLine className="h-6 w-6 text-blue-500" />,
      title: "Økt synlighet",
      description: "Få flere Google-anmeldelser og forbedre din synlighet i lokale søkeresultater."
    },
    {
      icon: <Users className="h-6 w-6 text-green-500" />,
      title: "Automatisk oppfølging",
      description: "La Revlo følge opp dine kunder som ikke har svart, helt automatisk."
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <img 
            src="/logo.png" 
            alt="Revlo Logo" 
            className="w-24 h-24 object-contain mx-auto"
            onError={(e) => e.currentTarget.style.display = 'none'} 
          />
        </motion.div>
        
        <motion.h2 
          className="text-2xl font-bold text-gray-800 mt-6 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Velkommen til Revlo
        </motion.h2>
        
        <motion.p
          className="text-gray-600 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Vi hjelper deg å samle flere anmeldelser på autopilot.
        </motion.p>
      </div>
      
      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {features.map((feature, index) => (
          <motion.div 
            key={index}
            className="flex items-start p-4 bg-white rounded-lg border border-gray-100 shadow-sm"
            variants={itemVariants}
          >
            <div className="mr-4 p-2 bg-gray-50 rounded-full">
              {feature.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{feature.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <Button 
          onClick={onNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          size="lg"
        >
          Kom i gang
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  )
} 