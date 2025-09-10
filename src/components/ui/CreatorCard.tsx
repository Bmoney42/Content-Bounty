import React from 'react'
import { User, TrendingUp, DollarSign, Users, Star } from 'lucide-react'

interface CreatorCardProps {
  name: string
  avatar: string
  followers: number
  earnings: number
  projects: number
  rating: number
  isTopCreator?: boolean
}

const CreatorCard: React.FC<CreatorCardProps> = ({
  name,
  avatar,
  followers,
  earnings,
  projects,
  rating,
  isTopCreator = false
}) => {
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 dark:border-gray-700 overflow-hidden electric-border">
      {/* Top Creator Badge */}
      {isTopCreator && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
            <Star className="w-3 h-3" />
            <span>TOP</span>
          </div>
        </div>
      )}
      
      {/* Gradient Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Avatar */}
      <div className="relative mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
          {avatar ? (
            <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-white" />
          )}
        </div>
        {/* Avatar Glow Effect */}
        <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
      </div>
      
      {/* Creator Name */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
        {name}
      </h3>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Followers</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {followers.toLocaleString()}
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Projects</span>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {projects}
          </div>
        </div>
      </div>
      
      {/* Earnings Section */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-center mb-2">
          <DollarSign className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">Total Earned</span>
        </div>
        <div className="text-2xl font-bold text-green-600 dark:text-green-400 text-center">
          ${earnings.toLocaleString()}
        </div>
      </div>
      
      {/* Rating */}
      <div className="flex items-center justify-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${
              i < rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`} 
          />
        ))}
        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
          {rating}.0
        </span>
      </div>
      
      {/* Hover Effect Particles */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-6 left-6 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  )
}

export default CreatorCard
