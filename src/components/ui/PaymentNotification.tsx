import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useConnectAccount } from '../../hooks/useConnectAccount'
import { AlertCircle, CreditCard, DollarSign } from 'lucide-react'

const PaymentNotification: React.FC = () => {
  const { user } = useAuth()
  const { canReceivePayments, connectStatus } = useConnectAccount()

  // Only show for creators who haven't set up banking
  if (user?.userType !== 'creator' || canReceivePayments) {
    return null
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Banking Setup Required
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Set up your banking information to receive payments from completed bounties.
          </p>
          <div className="mt-3">
            <Link
              to="/creator-banking"
              className="inline-flex items-center space-x-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Set Up Banking</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentNotification
