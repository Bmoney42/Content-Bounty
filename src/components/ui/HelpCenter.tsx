import React, { useState } from 'react'
import { ChevronDown, ChevronRight, HelpCircle, MessageCircle, Book, Video } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
  category: 'creator' | 'business' | 'general'
}

interface HelpCenterProps {
  userType: 'creator' | 'business'
  onClose: () => void
}

const HelpCenter: React.FC<HelpCenterProps> = ({ userType, onClose }) => {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<'creator' | 'business' | 'general'>('general')

  const faqData: FAQItem[] = [
    // General FAQs
    {
      question: 'How does Creator Bounty work?',
      answer: 'Creator Bounty connects businesses with content creators. Businesses post bounties (content requests), creators apply and submit content, and businesses pay upon approval.',
      category: 'general'
    },
    {
      question: 'Is Creator Bounty free to use?',
      answer: 'Yes! Creating an account and browsing bounties is completely free. We only take a small percentage when payments are processed.',
      category: 'general'
    },
    {
      question: 'How do I get paid?',
      answer: 'Once your content is approved by the business, payment is processed automatically through our secure payment system. You\'ll receive payment within 3-5 business days.',
      category: 'general'
    },
    {
      question: 'What types of content can I create?',
      answer: 'We support various content types including videos, graphics, articles, social media posts, and more. Each bounty specifies the exact requirements.',
      category: 'general'
    },
    
    // Creator FAQs
    {
      question: 'How do I apply for a bounty?',
      answer: 'Browse available bounties, click "Apply Now", and submit your proposal including your approach, timeline, and any relevant portfolio links.',
      category: 'creator'
    },
    {
      question: 'What happens if my content is rejected?',
      answer: 'You\'ll receive detailed feedback from the business. You can revise and resubmit your content based on their requirements.',
      category: 'creator'
    },
    {
      question: 'How do I build my portfolio?',
      answer: 'Your approved submissions automatically become part of your public portfolio, helping you attract more opportunities.',
      category: 'creator'
    },
    {
      question: 'Can I set my own rates?',
      answer: 'Bounties have predetermined budgets set by businesses. However, you can negotiate terms during the application process.',
      category: 'creator'
    },
    
    // Business FAQs
    {
      question: 'How do I create a bounty?',
      answer: 'Go to "Create Bounty" and fill out the form with your requirements, budget, deadline, and any specific guidelines.',
      category: 'business'
    },
    {
      question: 'How do I review submissions?',
      answer: 'View submissions in your dashboard, provide feedback, and approve or request revisions. You only pay when you\'re satisfied.',
      category: 'business'
    },
    {
      question: 'What if I\'m not satisfied with the content?',
      answer: 'You can request revisions or reject the submission. The creator can resubmit based on your feedback until you\'re satisfied.',
      category: 'business'
    },
    {
      question: 'How do I find the right creators?',
      answer: 'Browse creator portfolios, check their ratings and reviews, and review their previous work to find the perfect match.',
      category: 'business'
    }
  ]

  const filteredFAQs = faqData.filter(faq => 
    faq.category === selectedCategory || faq.category === 'general'
  )

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const categories = [
    { id: 'general', label: 'General', icon: <Book className="w-4 h-4" /> },
    { id: 'creator', label: 'For Creators', icon: <Video className="w-4 h-4" /> },
    { id: 'business', label: 'For Businesses', icon: <HelpCircle className="w-4 h-4" /> }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Help Center
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Category Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredFAQs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </span>
                  {expandedItems.has(index) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {expandedItems.has(index) && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Still need help?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">
                  Contact our support team for personalized assistance.
                </p>
              </div>
            </div>
            <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HelpCenter
