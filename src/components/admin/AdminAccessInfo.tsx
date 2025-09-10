import React from 'react'
import { Shield, Lock, AlertTriangle, CheckCircle } from 'lucide-react'

const AdminAccessInfo: React.FC = () => {

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Shield className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Access</h1>
              <p className="text-gray-600 mt-1">Secure administrative access control</p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Unauthorized Access Attempt
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Admin access is restricted to authorized personnel only. Your access attempt has been logged for security purposes.
                </p>
              </div>
            </div>
          </div>

          {/* How Admin Access Works */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                How Admin Access Works
              </h2>
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Whitelist-Based Access</p>
                    <p className="text-gray-600">Only specific email addresses are authorized for admin access.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Dual Verification</p>
                    <p className="text-gray-600">Email must be authorized AND explicitly granted admin privileges.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Security Logging</p>
                    <p className="text-gray-600">All admin access attempts are logged and monitored.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Status */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Status</h2>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-green-800">Security Active</p>
                    <p className="text-sm text-green-700">Admin access controls are properly configured and monitoring all access attempts.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Admin Access?</h2>
              <p className="text-gray-600 mb-4">
                If you believe you should have admin access to this platform, please contact the system administrator.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Security Policy:</strong> Admin access is only granted to authorized personnel 
                  who have been explicitly added to the system's security configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAccessInfo