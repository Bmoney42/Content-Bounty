import React, { useState } from 'react'
import { useToast } from '../utils/toastUtils'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import FormField from '../components/ui/FormField'
import OnboardingFlow from '../components/ui/OnboardingFlow'
import HelpCenter from '../components/ui/HelpCenter'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const ComponentDemo: React.FC = () => {
  const { addToast } = useToast()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [userType, setUserType] = useState<'creator' | 'business'>('creator')
  const [loadingDemo, setLoadingDemo] = useState(false)

  const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    addToast({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Toast`,
      message: `This is a ${type} notification example.`,
      duration: 5000
    })
  }

  const triggerLoadingDemo = () => {
    setLoadingDemo(true)
    setTimeout(() => setLoadingDemo(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Enhanced Components Demo
          </h1>
          <p className="text-gray-300 text-lg">
            Testing all the new MVP quick-win components
          </p>
        </div>

        {/* Loading Spinner Demo */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Loading Spinner Variants</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <LoadingSpinner size="sm" text="Small" />
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" text="Medium" />
            </div>
            <div className="text-center">
              <LoadingSpinner size="lg" text="Large" />
            </div>
            <div className="text-center">
              <LoadingSpinner size="xl" text="Extra Large" />
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <LoadingSpinner size="md" text="Default Variant" variant="default" />
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" text="Primary Variant" variant="primary" />
            </div>
            <div className="text-center">
              <LoadingSpinner size="md" text="Secondary Variant" variant="secondary" />
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={triggerLoadingDemo} disabled={loadingDemo}>
              {loadingDemo ? 'Loading...' : 'Show Full Screen Loading'}
            </Button>
            {loadingDemo && (
              <LoadingSpinner 
                size="xl" 
                text="Processing your request..." 
                variant="primary" 
                fullScreen 
              />
            )}
          </div>
        </Card>

        {/* Toast Demo */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Toast Notifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={() => showToast('success')} variant="primary">
              Success Toast
            </Button>
            <Button onClick={() => showToast('error')} variant="primary">
              Error Toast
            </Button>
            <Button onClick={() => showToast('warning')} variant="secondary">
              Warning Toast
            </Button>
            <Button onClick={() => showToast('info')} variant="outline">
              Info Toast
            </Button>
          </div>
        </Card>

        {/* Form Field Demo */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Form Field Validation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Email Address" 
              required 
              error="Please enter a valid email address"
            >
              <input 
                type="email" 
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </FormField>

            <FormField 
              label="Username" 
              required 
              success="Username is available!"
            >
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </FormField>

            <FormField 
              label="Password" 
              required
            >
              <input 
                type="password" 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
              />
            </FormField>

            <FormField 
              label="Bio" 
            >
              <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself"
                rows={3}
              />
            </FormField>
          </div>
        </Card>

        {/* Onboarding & Help Demo */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Onboarding & Help</h2>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-white">User Type:</label>
              <select 
                value={userType} 
                onChange={(e) => setUserType(e.target.value as 'creator' | 'business')}
                className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-gray-900"
              >
                <option value="creator">Creator</option>
                <option value="business">Business</option>
              </select>
            </div>
            
            <Button onClick={() => setShowOnboarding(true)}>
              Show Onboarding
            </Button>
            
            <Button onClick={() => setShowHelp(true)} variant="outline">
              Open Help Center
            </Button>
          </div>
        </Card>

        {/* Error Boundary Test */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Error Boundary Test</h2>
          <p className="text-gray-300 mb-4">
            This would normally trigger an error boundary, but we'll simulate it with a button.
          </p>
          <Button 
            onClick={() => {
              throw new Error('This is a test error to demonstrate the Error Boundary!')
            }}
            variant="primary"
          >
            Trigger Error Boundary
          </Button>
        </Card>
      </div>

      {/* Modals */}
      {showOnboarding && (
        <OnboardingFlow 
          userType={userType}
          onComplete={() => {
            setShowOnboarding(false)
            addToast({
              type: 'success',
              title: 'Onboarding Complete!',
              message: 'Welcome to Creator Bounty!'
            })
          }}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {showHelp && (
        <HelpCenter 
          userType={userType}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  )
}

export default ComponentDemo
