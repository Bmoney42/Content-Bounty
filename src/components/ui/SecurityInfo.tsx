import React, { useState } from 'react'
import { Shield, Info, ChevronDown, ChevronUp } from 'lucide-react'

interface SecurityInfoProps {
  className?: string
}

const SecurityInfo: React.FC<SecurityInfoProps> = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100 transition-colors rounded-lg"
      >
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-3" />
          <span className="font-medium text-blue-900">Security Information</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-blue-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 text-sm text-blue-800">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium">Rate Limiting Protection</p>
              <p className="text-blue-700">
                Your account is protected against brute force attacks with intelligent rate limiting.
              </p>
            </div>
          </div>
          
          <div className="ml-6 space-y-2 text-blue-700">
            <div>
              <strong>Login Protection:</strong>
              <ul className="list-disc list-inside ml-2">
                <li>Maximum 5 failed attempts per 15 minutes</li>
                <li>30-minute lockout after limit reached</li>
                <li>Tracking by both email and device fingerprint</li>
              </ul>
            </div>
            
            <div>
              <strong>Registration Protection:</strong>
              <ul className="list-disc list-inside ml-2">
                <li>Maximum 3 attempts per hour</li>
                <li>2-hour lockout after limit reached</li>
                <li>Additional IP-based monitoring</li>
              </ul>
            </div>
            
            <div>
              <strong>Additional Security:</strong>
              <ul className="list-disc list-inside ml-2">
                <li>Device fingerprinting for enhanced protection</li>
                <li>Automatic cleanup of old rate limit data</li>
                <li>Real-time warning system</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityInfo