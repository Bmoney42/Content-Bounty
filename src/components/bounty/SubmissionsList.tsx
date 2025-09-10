import React, { useState, useEffect } from 'react'
import { Eye, CheckCircle, XCircle, Clock, AlertCircle, Download, ExternalLink } from 'lucide-react'
import { BountySubmission } from '../../types/bounty'
import { firebaseDB } from '../../services/firebase'
import FeedbackModal from './FeedbackModal'
import { useNotification } from '../../utils/notificationUtils'

interface SubmissionsListProps {
  bountyId: string
  onClose: () => void
  onSubmissionUpdated: () => void
}

const SubmissionsList: React.FC<SubmissionsListProps> = ({ bountyId, onClose, onSubmissionUpdated }) => {
  const { showCelebration } = useNotification()
  const [submissions, setSubmissions] = useState<BountySubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<BountySubmission | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    action: 'approve' | 'reject' | 'request-changes'
    submission: BountySubmission | null
  }>({
    isOpen: false,
    action: 'approve',
    submission: null
  })

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true)
        console.log('🔍 Fetching submissions for bounty:', bountyId)
        const fetchedSubmissions = await firebaseDB.getBountySubmissions(bountyId)
        console.log('📤 Fetched submissions:', fetchedSubmissions)
        setSubmissions(fetchedSubmissions)
      } catch (error) {
        console.error('Error fetching submissions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [bountyId])

  const openFeedbackModal = (submission: BountySubmission, action: 'approve' | 'reject' | 'request-changes') => {
    setFeedbackModal({
      isOpen: true,
      action,
      submission
    })
  }

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      action: 'approve',
      submission: null
    })
  }

  const handleFeedbackSubmit = async (feedback: string) => {
    if (!feedbackModal.submission) return

    try {
      const status = feedbackModal.action === 'approve' ? 'approved' : 
                    feedbackModal.action === 'reject' ? 'rejected' : 'requires_changes'
      
      await firebaseDB.updateSubmissionStatus(feedbackModal.submission.id, status, feedback)
      
      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === feedbackModal.submission!.id 
          ? { ...sub, status, feedback, reviewedAt: new Date().toISOString() }
          : sub
      ))
      
      // Notify parent component
      onSubmissionUpdated?.()
      
      alert(`Submission ${feedbackModal.action === 'approve' ? 'approved' : 
              feedbackModal.action === 'reject' ? 'rejected' : 'changes requested'} successfully!`)
       
       // Note: Celebration will be triggered on the creator's side when they refresh their data
       
     } catch (error) {
       console.error('Error updating submission:', error)
       throw error
     }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'requires_changes':
        return 'bg-orange-100 text-orange-700 border-orange-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      case 'requires_changes':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="text-center">Loading submissions...</div>
                  </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={closeFeedbackModal}
        onSubmit={handleFeedbackSubmit}
        action={feedbackModal.action}
        submissionTitle={feedbackModal.submission?.creatorName}
      />
    </div>
  )
}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Content Submissions</h2>
            <p className="text-gray-600 mt-1">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} received
            </p>
          </div>
                     <button
             onClick={onClose}
             className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
           >
             <XCircle className="w-6 h-6 text-gray-500" />
           </button>
        </div>

        {/* Submissions List */}
        <div className="p-6">
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-600">
                Creators will appear here once they submit their content for this bounty.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 rounded-xl p-6">
                  {/* Submission Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(submission.status)}`}>
                        <span className="flex items-center space-x-1">
                          {getStatusIcon(submission.status)}
                          <span className="capitalize">{submission.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Creator Info */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Creator: {submission.creatorName}</h4>
                  </div>

                  {/* Content Links */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Content Links:</h5>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{submission.contentLinks}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2">Description:</h5>
                    <p className="text-sm text-gray-800">{submission.description}</p>
                  </div>

                  {/* Additional Notes */}
                  {submission.additionalNotes && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Additional Notes:</h5>
                      <p className="text-sm text-gray-800">{submission.additionalNotes}</p>
                    </div>
                  )}

                  {/* Content Files */}
                  {submission.contentFiles && submission.contentFiles.length > 0 && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2">Content Files ({submission.contentFiles.length}):</h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {submission.contentFiles.map((file, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <Download className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700 truncate">{file.fileName}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                              <div className="capitalize">{file.fileType.split('/')[1]}</div>
                            </div>
                            {file.url && (
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="w-3 h-3 inline mr-1" />
                                View File
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {submission.status === 'submitted' && (
                    <div className="flex space-x-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => openFeedbackModal(submission, 'approve')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => openFeedbackModal(submission, 'request-changes')}
                        className="flex-1 px-4 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>Request Changes</span>
                      </button>
                      <button
                        onClick={() => openFeedbackModal(submission, 'reject')}
                        className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={closeFeedbackModal}
        onSubmit={handleFeedbackSubmit}
        action={feedbackModal.action}
        submissionTitle={feedbackModal.submission?.creatorName}
      />
    </div>
  )
}

export default SubmissionsList
