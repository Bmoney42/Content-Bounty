import React, { useState } from 'react'
import { X, ChevronRight, ChevronLeft, Star, Target, DollarSign, Users } from 'lucide-react'

interface OnboardingStep {
  title: string
  description: string
  icon: React.ReactNode
}

interface OnboardingFlowProps {
  userType: 'creator' | 'business'
  onComplete: () => void
  onSkip: () => void
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ userType, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0)

  const creatorSteps: OnboardingStep[] = [
    {
      title: 'Welcome to Creator Bounty!',
      description: 'Connect with businesses and earn money by creating amazing content. Browse bounties, apply for opportunities, and get paid for your creativity.',
      icon: <Star className="w-12 h-12 text-yellow-500" />
    },
    {
      title: 'Browse & Apply',
      description: 'Discover bounties from businesses looking for content creators. Filter by category, payment, and requirements to find the perfect match.',
      icon: <Target className="w-12 h-12 text-blue-500" />
    },
    {
      title: 'Deliver & Get Paid',
      description: 'Submit your content, get feedback, and receive payment once approved. Track your earnings and build your portfolio.',
      icon: <DollarSign className="w-12 h-12 text-green-500" />
    }
  ]

  const businessSteps: OnboardingStep[] = [
    {
      title: 'Welcome to Creator Bounty!',
      description: 'Find talented creators to bring your vision to life. Post bounties, review submissions, and get high-quality content for your business.',
      icon: <Star className="w-12 h-12 text-yellow-500" />
    },
    {
      title: 'Create Bounties',
      description: 'Define your content needs, set budgets, and requirements. Reach thousands of creators ready to work on your projects.',
      icon: <Target className="w-12 h-12 text-blue-500" />
    },
    {
      title: 'Review & Approve',
      description: 'Review creator submissions, provide feedback, and approve content. Pay creators securely once you\'re satisfied.',
      icon: <Users className="w-12 h-12 text-green-500" />
    }
  ]

  const steps = userType === 'creator' ? creatorSteps : businessSteps

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-8 relative">
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            {steps[currentStep].icon}
          </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {steps[currentStep].description}
            </p>
          </div>

          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingFlow
