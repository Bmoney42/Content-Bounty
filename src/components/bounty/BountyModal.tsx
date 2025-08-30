import React from 'react'
import { X, DollarSign, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react'
import { Bounty } from '../../types/bounty'

interface BountyModalProps {
  bounty: Bounty | null
  isOpen: boolean
  onClose: () => void
  onApply: (bountyId: string) => void
}

const BountyModal: React.FC<BountyModalProps> = ({
  bounty,
  isOpen,
  onClose,
  onApply
}) => {
  if (!isOpen || !bounty) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{bounty.title}</h2>
            <p className="text-gray-600 font-medium">By {bounty.businessName}</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg">
              <DollarSign className="w-6 h-6 mr-3" />
              <span className="font-bold text-2xl">${bounty.payment.amount}</span>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-300"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10">
          {/* Description */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Description</h3>
            <p className="text-gray-700 leading-relaxed">{bounty.description}</p>
          </section>

          {/* Key Information */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Key Information</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-6 h-6 mr-4 text-blue-500" />
                  <span className="font-medium">
                    {bounty.deadline 
                      ? `Deadline: ${new Date(bounty.deadline).toLocaleDateString()}`
                      : 'No deadline specified'
                    }
                  </span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="w-6 h-6 mr-4 text-green-500" />
                  <span className="font-medium">
                    {bounty.maxApplicants 
                      ? `Max ${bounty.maxApplicants} applicants`
                      : 'Unlimited applicants'
                    }
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-2">Category</div>
                  <div className="capitalize text-gray-900 font-bold">{bounty.category}</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-2">Status</div>
                  <div className="capitalize text-gray-900 font-bold">{bounty.status}</div>
                </div>
              </div>
            </div>
          </section>

          {/* Requirements */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Requirements</h3>
            <div className="space-y-4">
              {bounty.requirements.map((requirement) => (
                <div key={requirement.id} className="flex items-start space-x-4">
                  {requirement.mandatory ? (
                    <AlertCircle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-gray-900 font-medium">{requirement.description}</span>
                    <span className="text-xs text-gray-500 ml-3 font-medium">
                      ({requirement.mandatory ? 'Required' : 'Optional'})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Talking Points */}
          {bounty.talkingPoints.length > 0 && (
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Key Talking Points</h3>
              <ul className="space-y-3">
                {bounty.talkingPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Payment Structure */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Structure</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-bold text-gray-900">
                  Total: ${bounty.payment.amount} {bounty.payment.currency}
                </span>
              </div>
              <div className="space-y-4">
                {bounty.payment.milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0">
                    <div>
                      <span className="text-gray-900 font-medium">{milestone.description}</span>
                      {milestone.minimumViews && (
                        <div className="text-sm text-gray-600 mt-1">
                          Minimum {milestone.minimumViews.toLocaleString()} views required
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-lg">
                        ${Math.round(bounty.payment.amount * (milestone.percentage / 100))}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">
                        {milestone.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-8 border-t border-gray-200">
          <div className="text-sm text-gray-600 font-medium">
            {bounty.applicationsCount} applications submitted
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl border border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              Close
            </button>
            <button 
              onClick={() => onApply(bounty.id)}
              disabled={bounty.status !== 'active'}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              Apply for This Bounty
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BountyModal