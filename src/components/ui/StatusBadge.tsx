import React from 'react'
import { CheckCircle, Clock, XCircle, AlertCircle, Play, Pause } from 'lucide-react'

export type StatusType = 
  | 'pending' 
  | 'in-progress' 
  | 'active'
  | 'completed' 
  | 'approved'
  | 'rejected' 
  | 'paused'
  | 'requires_changes'
  | 'under_review'
  | 'submitted'

interface StatusBadgeProps {
  status: StatusType
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return {
          icon: CheckCircle,
          label: status === 'completed' ? 'Completed' : 'Approved',
          className: 'bg-green-100 text-green-800 border border-green-200'
        }
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }
      case 'in-progress':
      case 'active':
        return {
          icon: Play,
          label: status === 'in-progress' ? 'In Progress' : 'Active',
          className: 'bg-blue-100 text-blue-800 border border-blue-200'
        }
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          className: 'bg-red-100 text-red-800 border border-red-200'
        }
      case 'paused':
        return {
          icon: Pause,
          label: 'Paused',
          className: 'bg-gray-100 text-gray-800 border border-gray-200'
        }
      case 'requires_changes':
        return {
          icon: AlertCircle,
          label: 'Needs Changes',
          className: 'bg-orange-100 text-orange-800 border border-orange-200'
        }
      case 'under_review':
        return {
          icon: Clock,
          label: 'Under Review',
          className: 'bg-purple-100 text-purple-800 border border-purple-200'
        }
      case 'submitted':
        return {
          icon: CheckCircle,
          label: 'Submitted',
          className: 'bg-cyan-100 text-cyan-800 border border-cyan-200'
        }
      default:
        return {
          icon: Clock,
          label: status,
          className: 'bg-gray-100 text-gray-800 border border-gray-200'
        }
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <span className={`
      inline-flex items-center space-x-1 font-semibold rounded-full
      ${config.className}
      ${sizeClasses[size]}
    `}>
      {showIcon && <Icon className={iconSizes[size]} />}
      <span className="capitalize">{config.label}</span>
    </span>
  )
}

export default StatusBadge