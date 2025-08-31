import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Bounty } from '../types/bounty'
import BountyList from '../components/bounty/BountyList'
import BountyModal from '../components/bounty/BountyModal'
import BusinessBountyList from '../components/bounty/BusinessBountyList'

const Bounties: React.FC = () => {
  const { user } = useAuth()
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Mock data - replace with actual API call
  const mockBounties: Bounty[] = [
    {
      id: '1',
      title: 'Review Our New Cryptocurrency Security App',
      description: 'Create an authentic video review showcasing our new crypto security app. Demonstrate key features like secure wallet integration, two-factor authentication, and transaction monitoring. Focus on ease of use and security benefits.',
      category: 'review',
      requirements: [
        {
          id: '1',
          type: 'views',
          description: 'Minimum 500 views within 30 days',
          mandatory: true
        },
        {
          id: '2',
          type: 'content',
          description: 'Video must be 3-8 minutes long',
          mandatory: true
        },
        {
          id: '3',
          type: 'hashtags',
          description: 'Include #CryptoSecurity #SafeWallet',
          mandatory: true
        },
        {
          id: '4',
          type: 'links',
          description: 'Include app store link in description',
          mandatory: true
        }
      ],
      talkingPoints: [
        'Highlight the app\'s military-grade encryption',
        'Demonstrate the simple 3-step setup process',
        'Show how transaction alerts work in real-time',
        'Compare security features with competitors'
      ],
      payment: {
        amount: 150,
        currency: 'USD',
        milestones: [
          {
            id: '1',
            description: 'Video published and meets requirements',
            percentage: 50,
            minimumViews: 100
          },
          {
            id: '2',
            description: 'Achieves minimum view count',
            percentage: 50,
            minimumViews: 500
          }
        ]
      },
      businessId: 'business1',
      businessName: 'SecurePhoneCo',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z',
      deadline: '2024-02-15T23:59:59Z',
      applicationsCount: 8,
      maxApplicants: 20
    },
    {
      id: '2',
      title: 'Interview the Founder - Trading Platform Deep Dive',
      description: 'Conduct a 15-20 minute interview with our CEO about the future of decentralized trading. Focus on our unique features, market advantages, and upcoming roadmap. Professional interview format preferred.',
      category: 'interview',
      requirements: [
        {
          id: '1',
          type: 'views',
          description: 'Minimum 1000 views within 30 days',
          mandatory: true
        },
        {
          id: '2',
          type: 'content',
          description: 'Interview format, 15-20 minutes',
          mandatory: true
        },
        {
          id: '3',
          type: 'platform',
          description: 'YouTube or podcast platform',
          mandatory: true
        }
      ],
      talkingPoints: [
        'Ask about our unique automated market maker',
        'Discuss the $5M Series A funding round',
        'Explore the team\'s Wall Street background',
        'Cover upcoming DeFi integrations'
      ],
      payment: {
        amount: 300,
        currency: 'USD',
        milestones: [
          {
            id: '1',
            description: 'Interview completed and published',
            percentage: 70
          },
          {
            id: '2',
            description: 'Reaches view milestone',
            percentage: 30,
            minimumViews: 1000
          }
        ]
      },
      businessId: 'business2',
      businessName: 'TradeFlow',
      status: 'active',
      createdAt: '2024-01-14T15:30:00Z',
      deadline: '2024-02-28T23:59:59Z',
      applicationsCount: 12,
      maxApplicants: 5
    },
    {
      id: '3',
      title: 'Tutorial: Complete Guide to Our NFT Marketplace',
      description: 'Create a comprehensive tutorial showing users how to buy, sell, and create NFTs on our platform. Cover wallet connection, gas fees, royalty settings, and marketplace features.',
      category: 'tutorial',
      requirements: [
        {
          id: '1',
          type: 'views',
          description: 'Minimum 750 views within 14 days',
          mandatory: true
        },
        {
          id: '2',
          type: 'content',
          description: 'Step-by-step tutorial format',
          mandatory: true
        },
        {
          id: '3',
          type: 'duration',
          description: '10-15 minutes in length',
          mandatory: false
        }
      ],
      talkingPoints: [
        'Show the wallet connection process',
        'Demonstrate creating your first NFT',
        'Explain our 2.5% marketplace fee advantage',
        'Highlight the artist royalty system'
      ],
      payment: {
        amount: 200,
        currency: 'USD',
        milestones: [
          {
            id: '1',
            description: 'Tutorial published',
            percentage: 60
          },
          {
            id: '2',
            description: 'Meets view requirement',
            percentage: 40,
            minimumViews: 750
          }
        ]
      },
      businessId: 'business3',
      businessName: 'NFTMarket Pro',
      status: 'active',
      createdAt: '2024-01-13T09:15:00Z',
      applicationsCount: 15,
    }
  ]

  // Business-owned bounties (demo data)
  const businessBounties: Bounty[] = [
    {
      id: '4',
      title: 'Demo: Product Review for TechStart',
      description: 'Create a comprehensive review of our new tech product. Focus on features, usability, and value proposition.',
      category: 'review',
      requirements: [
        {
          id: '1',
          type: 'views',
          description: 'Minimum 1000 views within 30 days',
          mandatory: true
        },
        {
          id: '2',
          type: 'content',
          description: 'Video must be 5-10 minutes long',
          mandatory: true
        }
      ],
      talkingPoints: [
        'Highlight key features',
        'Show real-world usage',
        'Compare with competitors'
      ],
      payment: {
        amount: 250,
        currency: 'USD',
        milestones: [
          {
            id: '1',
            description: 'Video published',
            percentage: 50
          },
          {
            id: '2',
            description: 'Meets view requirement',
            percentage: 50,
            minimumViews: 1000
          }
        ]
      },
      businessId: 'demo-business',
      businessName: 'TechStart Demo',
      status: 'active',
      createdAt: '2024-01-10T10:00:00Z',
      deadline: '2024-02-10T23:59:59Z',
      applicationsCount: 5,
      maxApplicants: 10
    },
    {
      id: '5',
      title: 'Demo: Tutorial for CryptoApp',
      description: 'Create a step-by-step tutorial for our cryptocurrency application.',
      category: 'tutorial',
      requirements: [
        {
          id: '1',
          type: 'views',
          description: 'Minimum 500 views within 14 days',
          mandatory: true
        }
      ],
      talkingPoints: [
        'Account setup process',
        'Basic trading features',
        'Security features'
      ],
      payment: {
        amount: 150,
        currency: 'USD',
        milestones: [
          {
            id: '1',
            description: 'Tutorial published',
            percentage: 100
          }
        ]
      },
      businessId: 'demo-business',
      businessName: 'CryptoApp Demo',
      status: 'in-progress',
      createdAt: '2024-01-08T10:00:00Z',
      deadline: '2024-01-25T23:59:59Z',
      applicationsCount: 3,
      maxApplicants: 5
    }
  ]

  const handleApply = (bountyId: string) => {
    // TODO: Implement bounty application logic
    console.log('Applying to bounty:', bountyId)
    alert('Application submitted! (This is a demo)')
  }

  const handleViewDetails = (bountyId: string) => {
    const allBounties = user?.userType === 'business' ? businessBounties : mockBounties
    const bounty = allBounties.find(b => b.id === bountyId)
    if (bounty) {
      setSelectedBounty(bounty)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBounty(null)
  }

  // Show different content based on user type
  if (user?.userType === 'business') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">My Bounties</h1>
            <p className="text-gray-300 text-lg">
              Manage your created bounties, review applications, and approve deliveries.
            </p>
          </div>

          <BusinessBountyList
            bounties={businessBounties}
            onViewDetails={handleViewDetails}
          />

          <BountyModal
            bounty={selectedBounty}
            isOpen={isModalOpen}
            onClose={closeModal}
            onApply={handleApply}
          />
        </div>
      </div>
    )
  }

  // Creator view - show all available bounties
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 py-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Available Bounties</h1>
          <p className="text-gray-300 text-lg">
            Browse and apply to content bounties that match your skills and audience. 
            Earn money creating authentic content for growing businesses.
          </p>
        </div>

        <BountyList
          bounties={mockBounties}
          onApply={handleApply}
          onViewDetails={handleViewDetails}
        />

        <BountyModal
          bounty={selectedBounty}
          isOpen={isModalOpen}
          onClose={closeModal}
          onApply={handleApply}
        />
      </div>
    </div>
  )
}

export default Bounties