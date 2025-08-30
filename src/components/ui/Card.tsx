import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'glass' | 'modern'
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  variant = 'default'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-12'
  }

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-lg',
    lg: 'shadow-xl',
    xl: 'shadow-2xl'
  }

  const variantClasses = {
    default: 'bg-white rounded-2xl border border-gray-200',
    glass: 'glass-card rounded-3xl',
    modern: 'modern-bounty-card rounded-3xl'
  }

  return (
    <div
      className={clsx(
        variantClasses[variant],
        paddingClasses[padding],
        shadowClasses[shadow],
        'transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card