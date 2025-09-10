import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const TermsOfService: React.FC = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last updated: December 2024</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Creator Bounty ("the Platform"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Creator Bounty is an online platform that connects content creators with businesses through a bounty system. Our services include:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Marketplace for content creation bounties</li>
              <li>Creator portfolio management and analytics</li>
              <li>Secure payment processing through Stripe</li>
              <li>Social media account integration (YouTube, etc.)</li>
              <li>Project collaboration tools</li>
              <li>Environmental impact initiatives (tree planting program)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Account Registration</h3>
                <p className="text-gray-700 leading-relaxed">
                  You must create an account to use our services. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">User Types</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Creators:</strong> Content creators who complete bounties and earn compensation</li>
                  <li><strong>Businesses:</strong> Companies that post bounties and hire creators for content projects</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Engage in harassment, abuse, or discriminatory behavior</li>
              <li>Attempt to gain unauthorized access to other accounts or systems</li>
              <li>Use automated scripts or bots to access the platform</li>
              <li>Post spam, malware, or other harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Bounty System</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Bounty Creation</h3>
                <p className="text-gray-700 leading-relaxed">
                  Businesses can create bounties with specific requirements, deadlines, and compensation amounts. All bounties must comply with our content guidelines and applicable laws.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Bounty Completion</h3>
                <p className="text-gray-700 leading-relaxed">
                  Creators must deliver work that meets the specified requirements and quality standards. Businesses have the right to request revisions or reject submissions that don't meet the agreed criteria.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment Terms</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Platform Fees</h3>
                <p className="text-gray-700 leading-relaxed">
                  Creator Bounty charges a service fee on completed transactions. Fee structures are clearly displayed before transaction completion.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Payment Processing</h3>
                <p className="text-gray-700 leading-relaxed">
                  All payments are processed through Stripe, a third-party payment processor. By using our platform, you agree to Stripe's terms of service and privacy policy.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Escrow System</h3>
                <p className="text-gray-700 leading-relaxed">
                  Payments for bounties are held in escrow until work is completed and approved, ensuring protection for both creators and businesses.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Content Ownership</h3>
                <p className="text-gray-700 leading-relaxed">
                  Creators retain ownership of their original content. By completing a bounty, creators grant the hiring business the agreed-upon usage rights as specified in the bounty terms.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Platform Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  Creator Bounty retains ownership of all platform features, designs, and proprietary technology. Users grant us a license to use their content for platform operation and promotion.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Social Media Integration</h2>
            <p className="text-gray-700 leading-relaxed">
              When connecting social media accounts (YouTube, etc.), you grant us permission to access read-only data for verification and analytics purposes. We do not post content on your behalf without explicit permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Environmental Commitment</h2>
            <p className="text-gray-700 leading-relaxed">
              Creator Bounty is committed to environmental sustainability. We donate a portion of platform revenue to tree planting and environmental restoration programs. Participation in these initiatives is automatic with platform usage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Privacy and Data Protection</h2>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these terms by reference.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Dispute Resolution</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Platform Mediation</h3>
                <p className="text-gray-700 leading-relaxed">
                  Creator Bounty provides dispute resolution services for conflicts between users. We encourage users to resolve disputes amicably with platform assistance.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Arbitration</h3>
                <p className="text-gray-700 leading-relaxed">
                  Any disputes that cannot be resolved through platform mediation will be subject to binding arbitration in accordance with applicable arbitration rules.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Creator Bounty shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the platform immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
            </p>
            <p className="text-gray-700 leading-relaxed">
              You may terminate your account at any time by contacting us. Upon termination, your right to use the platform will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. We will provide notice of changes through the platform or via email. Your continued use of the platform after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which Creator Bounty operates, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> legal@creatorbounty.xyz</p>
              <p className="text-gray-700"><strong>Address:</strong> Creator Bounty, LLC</p>
              <p className="text-gray-700"><strong>Website:</strong> https://www.creatorbounty.xyz</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Entire Agreement</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms of Service, together with our Privacy Policy, constitute the entire agreement between you and Creator Bounty regarding the use of the platform and supersede all prior agreements and understandings.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService