import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  variant?: 'default' | 'primary' | 'secondary'
  fullScreen?: boolean
  overlay?: boolean
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...',
  variant = 'default',
  fullScreen = false,
  overlay = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const variantClasses = {
    default: 'border-blue-200 border-t-blue-600',
    primary: 'border-blue-100 border-t-blue-500',
    secondary: 'border-gray-200 border-t-gray-600'
  }

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50'
    : overlay
    ? 'absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10'
    : 'flex flex-col items-center justify-center min-h-[200px] space-y-4'

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-4">
        <div 
          className={`${sizeClasses[size]} border-4 ${variantClasses[variant]} rounded-full animate-spin`}
        />
        {text && (
          <p className="text-gray-600 dark:text-gray-300 text-sm font-medium text-center max-w-xs">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}

export default LoadingSpinner