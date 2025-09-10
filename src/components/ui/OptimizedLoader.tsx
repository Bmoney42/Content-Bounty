import React from 'react'

interface OptimizedLoaderProps {
  height?: string
  className?: string
}

const OptimizedLoader: React.FC<OptimizedLoaderProps> = ({ 
  height = "h-64", 
  className = "" 
}) => {
  return (
    <div className={`${height} ${className} flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse rounded-lg`}>
      <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  )
}

export default OptimizedLoader