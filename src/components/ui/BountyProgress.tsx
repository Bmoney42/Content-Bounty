import React from 'react'
import { CheckCircle, Clock, FileText, DollarSign } from 'lucide-react'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'
import { Bounty, BountyApplication, BountySubmission } from '../../types/bounty'

interface BountyProgressProps {
  bounty: Bounty
  applications?: BountyApplication[]
  submissions?: BountySubmission[]
  userApplication?: BountyApplication
  userSubmission?: BountySubmission
  isCreator?: boolean
}

const BountyProgress: React.FC<BountyProgressProps> = ({
  bounty,
  applications = [],
  submissions = [],
  userApplication,
  userSubmission,
  isCreator = false
}) => {
  // Calculate progress steps
  const steps = [
    {
      id: 'application',
      label: 'Application',
      icon: FileText,
      completed: isCreator ? !!userApplication : applications.length > 0,
      current: isCreator ? !!userApplication && userApplication.status !== 'pending' : false
    },
    {
      id: 'approval',
      label: 'Approval',
      icon: CheckCircle,
      completed: isCreator ? userApplication?.status === 'accepted' : applications.some(app => app.status === 'accepted'),
      current: isCreator ? userApplication?.status === 'pending' : applications.some(app => app.status === 'pending')
    },
    {
      id: 'submission',
      label: 'Content Creation',
      icon: Clock,
      completed: isCreator ? !!userSubmission : submissions.length > 0,
      current: isCreator ? userApplication?.status === 'accepted' && !userSubmission : false
    },
    {
      id: 'payment',
      label: 'Payment',
      icon: DollarSign,
      completed: isCreator ? userSubmission?.status === 'approved' : submissions.some(sub => sub.status === 'approved'),
      current: isCreator ? userSubmission?.status === 'submitted' || userSubmission?.status === 'under_review' : false
    }
  ]

  const completedSteps = steps.filter(step => step.completed).length
  const currentStep = steps.find(step => step.current)

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {isCreator ? 'Your Progress' : 'Bounty Progress'}
        </h3>
        <StatusBadge status={bounty.status as any} />
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar
          current={completedSteps}
          total={steps.length}
          label="Overall Progress"
          color="blue"
        />
      </div>

      {/* Progress Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isCompleted = step.completed
          const isCurrent = step.current
          const isPending = !isCompleted && !isCurrent

          return (
            <div
              key={step.id}
              className={`flex items-center space-x-4 p-3 rounded-lg transition-colors ${
                isCompleted 
                  ? 'bg-green-50 border border-green-200' 
                  : isCurrent 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${
                    isCompleted 
                      ? 'text-green-800' 
                      : isCurrent 
                        ? 'text-blue-800' 
                        : 'text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                  
                  <span className={`text-sm ${
                    isCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-500'
                  }`}>
                    {isCompleted 
                      ? 'Complete' 
                      : isCurrent 
                        ? 'In Progress' 
                        : 'Pending'
                    }
                  </span>
                </div>
                
                {/* Additional status info */}
                {isCreator && step.id === 'application' && userApplication && (
                  <div className="mt-1">
                    <StatusBadge status={userApplication.status as any} size="sm" />
                  </div>
                )}
                
                {isCreator && step.id === 'submission' && userSubmission && (
                  <div className="mt-1">
                    <StatusBadge status={userSubmission.status as any} size="sm" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current Step Info */}
      {currentStep && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">
                Current Step: {currentStep.label}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {isCreator ? getCreatorStepMessage(currentStep.id, userApplication, userSubmission) : 
                 getBusinessStepMessage(currentStep.id, applications, submissions)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getCreatorStepMessage(stepId: string, application?: BountyApplication, submission?: BountySubmission): string {
  switch (stepId) {
    case 'application':
      return 'Your application is being reviewed by the business.'
    case 'approval':
      return application?.status === 'pending' 
        ? 'Waiting for application approval.' 
        : 'You can now start working on the content!'
    case 'submission':
      return 'Create and submit your content to complete the bounty.'
    case 'payment':
      return submission?.status === 'submitted' 
        ? 'Your submission is being reviewed for payment approval.' 
        : 'Your content is under review.'
    default:
      return 'Continue with the next step.'
  }
}

function getBusinessStepMessage(stepId: string, applications: BountyApplication[], submissions: BountySubmission[]): string {
  switch (stepId) {
    case 'application':
      return `${applications.length} application(s) received. Review and approve creators.`
    case 'approval':
      const pendingApps = applications.filter(app => app.status === 'pending').length
      return pendingApps > 0 ? `${pendingApps} application(s) awaiting your review.` : 'Applications approved. Waiting for content submission.'
    case 'submission':
      return 'Approved creators are working on content. You\'ll be notified when submissions arrive.'
    case 'payment':
      const pendingSubmissions = submissions.filter(sub => sub.status === 'submitted' || sub.status === 'under_review').length
      return pendingSubmissions > 0 ? `${pendingSubmissions} submission(s) ready for review.` : 'All submissions processed.'
    default:
      return 'Monitor bounty progress.'
  }
}

export default BountyProgress