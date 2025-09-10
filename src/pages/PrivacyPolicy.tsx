import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last updated: December 2024</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Creator Bounty ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our platform at https://www.creatorbounty.xyz and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Personal Information</h3>
                <p className="text-gray-700 leading-relaxed mb-2">We may collect the following personal information:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Profile information (username, profile picture, bio)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Social media account information when you connect accounts (YouTube, etc.)</li>
                  <li>Content and communications you submit through our platform</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Usage Information</h3>
                <p className="text-gray-700 leading-relaxed mb-2">We automatically collect:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, clicks)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Provide and maintain our platform services</li>
              <li>Process payments and manage bounty transactions</li>
              <li>Connect creators with businesses for content opportunities</li>
              <li>Authenticate and verify user accounts</li>
              <li>Send important notifications about your account and services</li>
              <li>Improve our platform and develop new features</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Google API Services and YouTube Integration</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">YouTube API Services</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Creator Bounty uses YouTube API Services to provide creator verification and audience analytics. When you connect your YouTube account:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Data Accessed:</strong> We access your YouTube channel information, subscriber count, video metadata, and public analytics using the <code>https://www.googleapis.com/auth/youtube.readonly</code> scope</li>
                  <li><strong>Purpose:</strong> This data is used to verify your creator status, display audience metrics to potential business partners, and match you with relevant content opportunities</li>
                  <li><strong>Read-Only Access:</strong> We only request read-only access and never post, upload, modify, or delete any content on your YouTube channel</li>
                  <li><strong>Data Display:</strong> YouTube metrics may be displayed on your Creator Bounty profile to showcase your reach to potential brand partners</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Google OAuth and Account Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  When you authenticate through Google OAuth, we may collect:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Your Google account email address for account linking and communication</li>
                  <li>Basic profile information (name, profile picture) for account setup</li>
                  <li>YouTube channel data as described above</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">Data Retention and Revocation</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You can revoke Creator Bounty's access to your Google data at any time by:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Visiting your Google Account's <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Apps with account access page</a></li>
                  <li>Removing Creator Bounty from your connected applications</li>
                  <li>Contacting us at <a href="mailto:privacy@creatorbounty.xyz" className="text-blue-600 underline">privacy@creatorbounty.xyz</a> for data deletion requests</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  When you revoke access, we will stop collecting new data from your Google/YouTube accounts, but previously collected data may be retained according to our data retention policies unless you request deletion.
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-900 text-sm">
                  <strong>Google API Services User Data Policy Compliance:</strong> Creator Bounty's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Information Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Other Users:</strong> Profile information may be visible to other platform users</li>
              <li><strong>Business Partners:</strong> Relevant information for bounty matching and collaboration</li>
              <li><strong>Service Providers:</strong> Third-party services that help us operate our platform (Firebase, Stripe, etc.)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We never sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Minimization and Limited Use</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Creator Bounty follows data minimization principles and only collects the minimum amount of information necessary to provide our services:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li><strong>Minimal Scope Requests:</strong> We only request the <code>youtube.readonly</code> scope, which provides read-only access to YouTube data</li>
                <li><strong>Purpose Limitation:</strong> Google API data is used exclusively for creator verification, audience metrics display, and content opportunity matching</li>
                <li><strong>No Third-Party Sharing:</strong> Google API data is never shared with third parties except as required for our core platform functionality</li>
                <li><strong>Limited Storage:</strong> We store only essential YouTube data needed for ongoing platform operation</li>
                <li><strong>Regular Review:</strong> We regularly review our data collection practices to ensure compliance with limited use requirements</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, secure data transmission, and regular security assessments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Data portability (receive your data in a portable format)</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content. You can manage your cookie preferences through your browser settings, but some features may not function properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our services are not intended for individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of our services after changes are made constitutes acceptance of the new policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> privacy@creatorbounty.xyz</p>
              <p className="text-gray-700"><strong>Address:</strong> Creator Bounty, LLC</p>
              <p className="text-gray-700"><strong>Website:</strong> https://www.creatorbounty.xyz</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy