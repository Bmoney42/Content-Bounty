import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CB</span>
              </div>
              <span className="text-xl font-bold">Creator Bounty</span>
            </div>
            <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
              Empowering creators to achieve financial freedom through premium brand partnerships. 
              Join the movement to help 1M creators build sustainable income streams.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Mail className="w-4 h-4 mr-3" />
                <span>support@creatorbounty.xyz</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-3" />
                <span>Creator Bounty, LLC</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/creators" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Browse Creators
                </Link>
              </li>
              <li>
                <Link to="/bounties" className="text-gray-300 hover:text-white transition-colors duration-200">
                  View Bounties
                </Link>
              </li>
              <li>
                <Link to="/upgrade" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Premium Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal & Support</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/privacy" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center"
                >
                  Privacy Policy
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="text-gray-300 hover:text-white transition-colors duration-200 inline-flex items-center"
                >
                  Terms of Service
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@creatorbounty.xyz" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a 
                  href="mailto:legal@creatorbounty.xyz" 
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Legal Inquiries
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © {currentYear} Creator Bounty, LLC. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>🌱 100% to Creators</span>
              <span>•</span>
              <span>🌍 Environmental Impact</span>
              <span>•</span>
              <span>🚀 Empowering 1M+ Creators</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer