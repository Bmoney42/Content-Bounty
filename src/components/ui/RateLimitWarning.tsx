import React from 'react'
import { Shield, Clock, AlertTriangle } from 'lucide-react'

interface RateLimitWarningProps {
  isBlocked: boolean
  remainingAttempts: number
  timeUntilUnblockedFormatted?: string
  actionType: 'login' | 'register'
  className?: string
}

const RateLimitWarning: React.FC<RateLimitWarningProps> = ({
  isBlocked,
  remainingAttempts,
  timeUntilUnblockedFormatted,
  actionType,
  className = ''
}) => {
  if (isBlocked) {
    return (
      <div className={`bg-red-50 border-l-4 border-red-400 p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Account Temporarily Locked
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>
                Too many failed {actionType} attempts. Your account has been temporarily locked for security.
              </p>
              {timeUntilUnblockedFormatted && (
                <div className="mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    Try again in: {timeUntilUnblockedFormatted}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (remainingAttempts <= 2) {
    return (
      <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Security Warning
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You have <span className="font-medium">{remainingAttempts}</span> {actionType} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining 
                before your account is temporarily locked.
              </p>
              <p className="mt-1">
                Please ensure you're using the correct credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default RateLimitWarning