import React from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  success?: string
  children: React.ReactNode
  className?: string
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  success,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {children}
        
        {(error || success) && (
          <div className={`flex items-center mt-2 text-sm ${
            error ? 'text-red-600' : 'text-green-600'
          }`}>
            {error ? (
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            )}
            <span>{error || success}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default FormField
