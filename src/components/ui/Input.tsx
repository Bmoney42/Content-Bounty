import React, { forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  variant?: 'default' | 'modern'
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className,
  id,
  variant = 'default',
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  const inputClasses = {
    default: clsx(
      'block w-full px-4 py-3 border-2 rounded-2xl shadow-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm font-medium transition-all duration-300',
      error
        ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50'
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400',
      className
    ),
    modern: clsx(
      'modern-input block w-full px-4 py-3 rounded-2xl text-sm font-medium',
      error && 'border-red-400 focus:border-red-400',
      className
    )
  }

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-semibold ${
            variant === 'modern' ? 'text-white/80' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={inputClasses[variant]}
        {...props}
      />
      {error && (
        <p className={`text-sm font-medium ${
          variant === 'modern' ? 'text-red-400' : 'text-red-600'
        }`}>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className={`text-sm font-medium ${
          variant === 'modern' ? 'text-white/60' : 'text-gray-500'
        }`}>
          {helperText}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input