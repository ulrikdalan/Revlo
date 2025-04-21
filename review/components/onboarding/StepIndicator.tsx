'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface Step {
  id: string
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: string[]
  className?: string
}

export default function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex justify-between items-center mb-2">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center space-y-2">
              <motion.div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep > index || completedSteps.includes(step.id)
                    ? 'border-green-500 bg-green-50 text-green-500'
                    : currentStep === index
                    ? 'border-blue-500 bg-blue-50 text-blue-500'
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                )}
                initial={false}
                animate={{
                  scale: currentStep === index ? 1.1 : 1,
                  transition: { type: "spring", stiffness: 400, damping: 15 }
                }}
              >
                {currentStep > index || completedSteps.includes(step.id) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </motion.div>
              <span className={cn(
                "text-xs font-medium hidden md:block",
                currentStep === index ? "text-blue-600" : 
                currentStep > index || completedSteps.includes(step.id) ? "text-green-600" : 
                "text-gray-400"
              )}>
                {step.label}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div className="relative flex-1 mx-2">
                <div className="absolute top-5 transform -translate-y-1/2 h-[2px] w-full bg-gray-200">
                  <motion.div 
                    className="h-full bg-green-500"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: currentStep > index ? "100%" : "0%",
                      transition: { duration: 0.3 }
                    }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
} 