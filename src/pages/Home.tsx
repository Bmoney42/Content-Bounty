import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, DollarSign, Users, Shield, TrendingUp, Play, Star, Eye, Clock, Sparkles, Zap, Target, CheckCircle, ArrowUpRight, ChevronRight } from 'lucide-react'

const Home: React.FC = () => {
  const stats = [
    { label: 'Paid to Creators', value: '$50K+', icon: DollarSign, highlight: true },
    { label: 'Active Creators', value: '500+', icon: Users },
    { label: 'Businesses', value: '100+', icon: TrendingUp },
    { label: 'Platform Fee', value: '0%', icon: Shield, highlight: true }
  ]

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get your content created and published in days, not weeks. Our streamlined process ensures quick turnaround times.",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: Target,
      title: "Precision Targeting",
      description: "Connect with creators who perfectly match your brand and audience. No more wasted ad spend.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Shield,
      title: "Quality Guaranteed",
      description: "Every creator is vetted and every piece of content is reviewed. Quality is non-negotiable.",
      gradient: "from-green-400 to-emerald-500"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow",
      content: "Content Bounty helped us increase our conversion rate by 300%. The creators are incredibly professional.",
      avatar: "SC",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Founder",
      company: "CryptoVault",
      content: "We've spent $50K on traditional ads with minimal results. Content Bounty delivered 10x better ROI in just 2 months.",
      avatar: "MR",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Content Creator",
      company: "TechReviews",
      content: "I've earned over $15K creating authentic content for amazing brands. The platform is incredibly fair to creators.",
      avatar: "ET",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-full text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              <span>The Future of Content Creation</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Connect with creators who
              <span className="block text-blue-600">
                deliver results
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Content Bounty connects businesses with authentic creators. 
              <span className="font-semibold text-gray-900"> No platform fees.</span>
              <span className="font-semibold text-gray-900"> 100% goes to creators.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-20">
              <Link 
                to="/login" 
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              
              <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-300">
                <Play className="w-5 h-5 mr-2" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center`}>
                      <stat.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="text-4xl font-bold mb-3 text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Why choose Content Bounty?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're revolutionizing how businesses connect with creators. 
              No middlemen, no hidden fees, just authentic content that converts.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-2xl p-10 hover:shadow-xl transition-all duration-500">
                <div className={`w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-8`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              What our users are saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">{testimonial.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-bold">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role} at {testimonial.company}</div>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-5xl font-bold text-white mb-8">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of businesses and creators who are already using Content Bounty to grow their reach and revenue.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center px-10 py-5 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300"
          >
            <span>Start Creating</span>
            <ChevronRight className="w-6 h-6 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home