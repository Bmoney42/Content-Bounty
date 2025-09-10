import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { firebaseDB } from '../services/firebase'
import Layout from '../components/layout/Layout'
import { 
  Trash2, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  User,
  Database,
  FileText,
  Mail,
  Phone
} from 'lucide-react'

const DataDeletionInstructions: React.FC = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [deletionStatus, setDeletionStatus] = useState<'pending' | 'completed' | 'failed' | 'error' | null>(null)
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null)

  useEffect(() => {
    const status = searchParams.get('status')
    const code = searchParams.get('code')
    
    if (status) {
      setDeletionStatus(status as any)
    }
    if (code) {
      setConfirmationCode(code)
    }
  }, [searchParams])

  const handleDataDeletionRequest = async () => {
    if (!user) {
      alert('Please log in to request data deletion.')
      return
    }

    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      // Create a data deletion request
      await firebaseDB.collection('dataDeletionRequests').add({
        userId: user.id,
        userEmail: user.email,
        requestedAt: new Date().toISOString(),
        status: 'pending',
        platform: 'manual_request',
        confirmationCode: `manual_${Date.now()}`
      })

      alert('Your data deletion request has been submitted. We will process it within 30 days as required by law.')
      setDeletionStatus('pending')
    } catch (error) {
      console.error('Error submitting data deletion request:', error)
      alert('Failed to submit data deletion request. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusMessage = () => {
    switch (deletionStatus) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          title: 'Data Deletion Completed',
          message: 'Your Facebook data has been successfully deleted from our platform.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'failed':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
          title: 'Data Deletion In Progress',
          message: 'We encountered an issue with automatic deletion. Please contact support for manual processing.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'error':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
          title: 'Data Deletion Error',
          message: 'An error occurred during the deletion process. Please contact support.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'pending':
        return {
          icon: <Clock className="w-6 h-6 text-blue-500" />,
          title: 'Data Deletion Requested',
          message: 'Your data deletion request has been submitted and will be processed within 30 days.',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      default:
        return null
    }
  }

  const statusInfo = getStatusMessage()

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-xl shadow-sm p-8">
            {/* Header */}
            <div className="flex items-center mb-8">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Data Deletion Instructions</h1>
                <p className="text-gray-600 mt-1">How to delete your data from Creator Bounty</p>
              </div>
            </div>

            {/* Status Message */}
            {statusInfo && (
              <div className={`border-l-4 ${statusInfo.borderColor} ${statusInfo.bgColor} p-4 mb-8`}>
                <div className="flex items-start">
                  {statusInfo.icon}
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${statusInfo.color}`}>
                      {statusInfo.title}
                    </h3>
                    <p className={`mt-1 text-sm ${statusInfo.color}`}>
                      {statusInfo.message}
                    </p>
                    {confirmationCode && (
                      <p className="mt-2 text-xs text-gray-500">
                        Confirmation Code: {confirmationCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* What Data We Collect */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What Data We Collect</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Account Information
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Name and email address</li>
                    <li>• User type (creator/business)</li>
                    <li>• Profile information</li>
                    <li>• Account preferences</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                    <Database className="w-4 h-4 mr-2" />
                    Platform Data
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Bounty applications and submissions</li>
                    <li>• Payment and transaction history</li>
                    <li>• Social media connections</li>
                    <li>• Content and files uploaded</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Deletion Options */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Delete Your Data</h2>
              
              <div className="space-y-6">
                {/* Automatic Deletion (Facebook) */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Automatic Deletion (Facebook Users)
                  </h3>
                  <p className="text-gray-600 mb-4">
                    If you connected your Facebook account, you can delete your data directly through Facebook:
                  </p>
                  <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
                    <li>Go to your Facebook Settings</li>
                    <li>Navigate to "Apps and Websites"</li>
                    <li>Find "Creator Bounty" in your connected apps</li>
                    <li>Click "Remove" and select "Delete all data"</li>
                  </ol>
                  <p className="text-sm text-gray-500">
                    This will automatically trigger data deletion on our platform within 24 hours.
                  </p>
                </div>

                {/* Manual Deletion */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Trash2 className="w-5 h-5 text-red-500 mr-2" />
                    Manual Deletion Request
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You can also request data deletion directly through our platform:
                  </p>
                  
                  {user ? (
                    <button
                      onClick={handleDataDeletionRequest}
                      disabled={loading}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? 'Processing...' : 'Request Data Deletion'}
                    </button>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        Please log in to your account to request data deletion.
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Support */}
                <div className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                    <Mail className="w-5 h-5 text-blue-500 mr-2" />
                    Contact Support
                  </h3>
                  <p className="text-gray-600 mb-4">
                    For immediate assistance or questions about data deletion:
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <strong>Email:</strong> support@creatorbounty.xyz
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Subject:</strong> Data Deletion Request
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Information */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Legal Information</h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">GDPR Compliance</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Under the General Data Protection Regulation (GDPR), you have the right to request 
                  deletion of your personal data. We will process your request within 30 days.
                </p>
                <h3 className="font-medium text-blue-900 mb-2">CCPA Compliance</h3>
                <p className="text-sm text-blue-800">
                  Under the California Consumer Privacy Act (CCPA), California residents have the 
                  right to delete their personal information. We will process your request within 45 days.
                </p>
              </div>
            </div>

            {/* Privacy Policy Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                For more information, please read our{' '}
                <a 
                  href="/privacy-policy" 
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DataDeletionInstructions
