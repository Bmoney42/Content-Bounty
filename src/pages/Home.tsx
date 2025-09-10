import React, { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, DollarSign, Users, Shield, TrendingUp, Play, Star, Eye, Clock, Sparkles, Zap, Target, CheckCircle, ArrowUpRight, ChevronRight, Sun, Moon, ShieldCheck, Lock, CreditCard, XCircle } from 'lucide-react'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver'

// Lazy load non-critical components
const CreatorCard = lazy(() => import('../components/ui/CreatorCard'))
const Footer = lazy(() => import('../components/layout/Footer'))
const OptimizedLoader = lazy(() => import('../components/ui/OptimizedLoader'))

const Home: React.FC = () => {
  const [counts, setCounts] = useState({
    paid: 50, // Start with final values for faster FCP
    creators: 500,
    businesses: 100,
    fee: 0
  })

  const [isVisible, setIsVisible] = useState(true) // Start visible for faster FCP
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Intersection observers for lazy loading sections
  const featuresSection = useIntersectionObserver({ threshold: 0.05, rootMargin: '50px' }) // Reduced thresholds
  const creatorsSection = useIntersectionObserver({ threshold: 0.05, rootMargin: '50px' })
  const testimonialsSection = useIntersectionObserver({ threshold: 0.05, rootMargin: '50px' })

  useEffect(() => {
    // Skip animation on initial load for faster FCP
    // Animation will only run if user navigates back to home
    const hasVisited = sessionStorage.getItem('home-visited')
    
    if (!hasVisited) {
      sessionStorage.setItem('home-visited', 'true')
      // Keep static values for initial load
      return
    }
    
    // Only animate on subsequent visits
    const startCounters = () => {
      const startTime = Date.now()
      const duration = 1500 // Reduced duration
      
      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Simplified easing
        const easeProgress = progress * progress * (3 - 2 * progress)
        
        setCounts({
          paid: Math.floor(50 * easeProgress),
          creators: Math.floor(500 * easeProgress),
          businesses: Math.floor(100 * easeProgress),
          fee: 0
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }
    
    const timer = setTimeout(startCounters, 200) // Much faster start
    return () => clearTimeout(timer)
  }, [])

  // Throttled mouse move handler for better performance
  const handleMouseMove = useCallback((e: React.MouseEvent, cardIndex: number) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calculate relative position (0 to 1)
    const relativeX = x / rect.width
    const relativeY = y / rect.height
    
    setMousePosition({ x: relativeX, y: relativeY })
    setHoveredCard(cardIndex)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredCard(null)
  }, [])

  // Memoized tilt style calculation
  const getTiltStyle = useCallback((cardIndex: number) => {
    if (hoveredCard !== cardIndex) return {}
    
    // Calculate tilt based on mouse position
    const tiltX = (mousePosition.y - 0.5) * 15 // Reduced for mobile performance
    const tiltY = (mousePosition.x - 0.5) * 15
    
    return {
      transform: `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02) translateY(-4px)`,
      transition: 'transform 0.15s ease-out'
    }
  }, [hoveredCard, mousePosition])

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode)
  }, [isDarkMode])

  // Memoized stats to prevent unnecessary re-renders
  const stats = useMemo(() => [
    { label: 'Paid to Creators', value: counts.paid, suffix: 'K+', icon: DollarSign, highlight: true },
    { label: 'Lives Changed', value: counts.creators, suffix: '+', icon: Users },
    { label: 'Premium Brands', value: counts.businesses, suffix: '+', icon: TrendingUp },
    { label: '100% To Creators', value: '0%', suffix: ' Fees', icon: Eye, highlight: true }
  ], [counts.paid, counts.creators, counts.businesses])

  // Static data - only computed once
  const features = useMemo(() => [
    {
      icon: Zap,
      title: "100% to Creators",
      description: "Keep every dollar you earn with zero platform fees or hidden charges. We believe creators deserve 100% of their earnings.",
      gradient: "from-green-400 to-emerald-500"
    },
    {
      icon: Target,
      title: "Premium Partnerships",
      description: "Access exclusive partnerships with top-tier brands that pay premium rates and respect creator value and creative freedom.",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Shield,
      title: "Community Support",
      description: "Join a community of 500+ creators supporting each other's journey to financial freedom with mentorship and collaboration.",
      gradient: "from-green-400 to-emerald-500"
    }
  ], [])

  // Memoized static data
  const topCreators = useMemo(() => [
    {
      name: "Sarah Chen",
      avatar: "",
      followers: 12500,
      earnings: 15420,
      projects: 23,
      rating: 5,
      isTopCreator: true
    },
    {
      name: "Marcus Rodriguez",
      avatar: "",
      followers: 8900,
      earnings: 12850,
      projects: 18,
      rating: 5,
      isTopCreator: false
    },
    {
      name: "Emma Thompson",
      avatar: "",
      followers: 15600,
      earnings: 18900,
      projects: 31,
      rating: 5,
      isTopCreator: false
    },
    {
      name: "Alex Johnson",
      avatar: "",
      followers: 7200,
      earnings: 9800,
      projects: 15,
      rating: 4,
      isTopCreator: false
    },
    {
      name: "Maria Garcia",
      avatar: "",
      followers: 11200,
      earnings: 14200,
      projects: 27,
      rating: 5,
      isTopCreator: false
    },
    {
      name: "David Kim",
      avatar: "",
      followers: 6800,
      earnings: 8700,
      projects: 12,
      rating: 4,
      isTopCreator: false
    }
  ], [])

  const testimonials = useMemo(() => [
    {
      name: "Sarah Chen",
      role: "Marketing Director",
      company: "TechFlow",
      content: "Creator Bounty helped us increase our conversion rate by 300%. The creators are incredibly professional.",
      avatar: "SC",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Founder",
      company: "CryptoVault",
      content: "We've spent $50K on traditional ads with minimal results. Creator Bounty delivered 10x better ROI in just 2 months.",
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
  ], [])

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>


      {/* Reduced floating background elements for better performance */}
      <div className={`absolute top-20 left-10 w-24 h-24 rounded-full blur-lg opacity-50 ${
        isDarkMode ? 'bg-blue-500/20' : 'bg-blue-500/10'
      }`}></div>
      <div className={`absolute bottom-40 right-20 w-32 h-32 rounded-full blur-lg opacity-30 ${
        isDarkMode ? 'bg-purple-500/20' : 'bg-purple-500/10'
      }`}></div>

      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={toggleDarkMode}
          className={`p-3 rounded-full transition-all duration-300 ${
            isDarkMode 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-gray-900/10 text-gray-700 hover:bg-gray-900/20'
          }`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center hero-content">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Empowering Creators</span>
            </div>

            {/* Main Heading with Gradient Text */}
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Join the movement to Empower
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                1M creators financially free
              </span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl max-w-3xl mx-auto mb-12 leading-relaxed ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              We're building the world's largest online platform to help creators achieve financial freedom. 
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> Earn more.</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> Work with amazing brands.</span>
              <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}> Build your portfolio.</span>
            </p>

            {/* CTA Buttons with Electric Borders */}
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-20">
              <Link 
                to="/login" 
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="w-5 h-5 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <button className={`group relative inline-flex items-center px-8 py-4 font-semibold rounded-xl border transition-all duration-300 overflow-hidden ${
                isDarkMode 
                  ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' 
                  : 'bg-white text-gray-700 border-gray-200 hover:shadow-xl'
              }`}>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isDarkMode 
                    ? 'bg-white/10' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200'
                }`}></div>
                <Play className="w-5 h-5 mr-2 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">Watch Demo</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className={`group relative rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow duration-200 ${
                    isDarkMode 
                      ? 'bg-white/10 backdrop-blur-sm border border-white/20' 
                      : 'bg-white'
                  }`}
                >
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-200">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`text-4xl font-bold mb-3 group-hover:text-blue-600 transition-colors duration-100 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {stat.value}{stat.suffix}
                  </div>
                  <div className={`font-medium group-hover:text-gray-800 transition-colors duration-100 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>{stat.label}</div>
                  
                  {/* Simplified hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Creator Protection Section */}
      <section className="py-24 bg-gradient-to-r from-green-50 via-emerald-50 to-green-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 bg-green-500 rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-emerald-500 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-600 rounded-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-full text-sm font-semibold mb-8">
              <ShieldCheck className="w-4 h-4" />
              <span>Creator Protection Guarantee</span>
            </div>
            
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Your Payment is <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">Guaranteed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Unlike other platforms, we require businesses to pay upfront before posting bounties. 
              Your hard work is <strong>always</strong> backed by secured funds in escrow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Upfront Payment */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-green-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Payment Required Upfront</h3>
              <p className="text-gray-600 leading-relaxed">
                Businesses must pay the full bounty amount before posting. No fake projects, no empty promises – only funded opportunities.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-green-600 font-semibold">
                <CheckCircle className="w-5 h-5" />
                <span>100% Pre-funded</span>
              </div>
            </div>

            {/* Escrow Protection */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-green-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Secure Escrow System</h3>
              <p className="text-gray-600 leading-relaxed">
                All payments are held securely in escrow until you complete and submit your work. Protected by bank-level security.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-green-600 font-semibold">
                <Shield className="w-5 h-5" />
                <span>Bank-Level Security</span>
              </div>
            </div>

            {/* Guaranteed Release */}
            <div className="group bg-white rounded-2xl p-8 shadow-lg border border-green-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Automatic Payment Release</h3>
              <p className="text-gray-600 leading-relaxed">
                Once you submit quality work and it's approved, payment is released immediately. Fair dispute resolution protects both parties.
              </p>
              <div className="mt-4 flex items-center space-x-2 text-green-600 font-semibold">
                <CheckCircle className="w-5 h-5" />
                <span>Instant Release</span>
              </div>
            </div>
          </div>

          {/* Comparison with other platforms */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-200">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">How We Compare</h3>
              <p className="text-gray-600">See why creators choose Creator Bounty for guaranteed payments</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Platform</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Upfront Payment</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Platform Fees</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Payment Security</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 bg-green-50">
                    <td className="py-4 px-6 font-bold text-green-600">Creator Bounty</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-1 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Required</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-green-600">0%</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-1 text-green-600">
                        <Shield className="w-5 h-5" />
                        <span className="font-semibold">Guaranteed</span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-600">Other Platforms</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center space-x-1 text-red-500">
                        <XCircle className="w-5 h-5" />
                        <span>Optional/None</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-red-500 font-semibold">15-20%</td>
                    <td className="py-4 px-6 text-center text-yellow-600">Variable</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-12">
            <div className="flex flex-wrap justify-center items-center space-x-8 space-y-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <ShieldCheck className="w-6 h-6 text-green-600" />
                <span className="font-medium">$50K+ Secured in Escrow</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Users className="w-6 h-6 text-green-600" />
                <span className="font-medium">500+ Protected Creators</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Star className="w-6 h-6 text-green-600" />
                <span className="font-medium">4.9/5 Trust Rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Paid Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/4 w-24 h-24 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold mb-8">
              <DollarSign className="w-4 h-4" />
              <span>Getting Paid Made Simple</span>
            </div>
            
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Get Paid in <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">3 Easy Steps</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined process ensures you get paid fast and securely for your creative work.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-blue-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-lg">
                  1
                </div>
                <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Find & Apply</h3>
                <p className="text-gray-700 leading-relaxed">
                  Browse funded bounties (✅) and apply to ones that match your skills. All bounties are pre-paid and guaranteed.
                </p>
              </div>
              {/* Connector Arrow */}
              <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-gray-300">
                <ChevronRight className="w-8 h-8" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-green-200">
                <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-lg">
                  2
                </div>
                <Play className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Create Content</h3>
                <p className="text-gray-700 leading-relaxed">
                  Get accepted and create amazing content following the brief. Upload your deliverables when ready.
                </p>
              </div>
              {/* Connector Arrow */}
              <div className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-gray-300">
                <ChevronRight className="w-8 h-8" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-purple-200">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-6 shadow-lg">
                  3
                </div>
                <DollarSign className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Paid</h3>
                <p className="text-gray-700 leading-relaxed">
                  Business approves your content and funds are instantly released from escrow to your account. No waiting!
                </p>
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="mt-16 bg-gradient-to-r from-gray-50 to-blue-50 rounded-3xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">⚡ Lightning Fast Payouts</h3>
              <p className="text-gray-600">Money moves from escrow to your bank account automatically</p>
            </div>
            
            <div className="flex items-center justify-center space-x-4 md:space-x-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Content Approved</p>
                <p className="text-xs text-gray-600">Instant</p>
              </div>
              
              <ArrowRight className="w-6 h-6 text-gray-400" />
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Escrow Released</p>
                <p className="text-xs text-gray-600">Instant</p>
              </div>
              
              <ArrowRight className="w-6 h-6 text-gray-400" />
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-2">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Money in Bank</p>
                <p className="text-xs text-gray-600">1-2 days</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Link 
              to="/register" 
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span>Start Earning Today</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresSection.ref} className="py-24 bg-white relative">
        {featuresSection.isIntersecting && (
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Why creators love Creator Bounty?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of creators who are earning more, working with amazing brands, 
              and building their portfolios on the path to financial freedom.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className={`group bg-gray-50 border border-gray-200 rounded-2xl p-10 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${1200 + index * 200}ms` }}>
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        )}
      </section>

      {/* Charity Section */}
      <section className="py-24 bg-gradient-to-r from-green-50 to-emerald-50 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Making a Positive Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every project on Creator Bounty contributes to environmental restoration. 
              We're committed to planting trees and supporting sustainable initiatives.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Tree Planting Program</h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">
                  We're committed to environmental restoration and plant trees through our own initiatives. 
                  Your creativity earns you money—and we handle the environmental impact separately.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-green-600">1,000+</div>
                  <div className="text-gray-600">Trees planted so far</div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">100% to Creators</h3>
                <p className="text-gray-600 leading-relaxed text-lg mb-6">
                  Every dollar from bounty payments goes directly to creators. We believe creators deserve 100% of their earnings 
                  with zero platform fees or hidden charges.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-blue-600">100%</div>
                  <div className="text-gray-600">Goes to creators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Creators Section */}
      <section ref={creatorsSection.ref} className="py-24 bg-gradient-to-r from-gray-50 to-blue-50 relative">
        {creatorsSection.isIntersecting && (
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Meet Our Top Creators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how creators are achieving financial freedom on our platform. 
              These success stories prove that your dreams are within reach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {topCreators.map((creator, index) => (
              <div 
                key={index} 
                className={`transform transition-all duration-500 ${
                  isVisible ? 'opacity-100' : 'opacity-0'
                }`} 
                style={{ transitionDelay: `${1400 + index * 100}ms` }}
              >
                <Suspense fallback={<OptimizedLoader />}>
                  <CreatorCard
                    name={creator.name}
                    avatar={creator.avatar}
                    followers={creator.followers}
                    earnings={creator.earnings}
                    projects={creator.projects}
                    rating={creator.rating}
                    isTopCreator={creator.isTopCreator}
                  />
                </Suspense>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/creators" 
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300"
            >
              <span>View All Creators</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
        )}
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsSection.ref} className="py-24 bg-gray-50 relative">
        {testimonialsSection.isIntersecting && (
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              What our users are saying
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className={`group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: `${1600 + index * 200}ms` }}>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-bold">{testimonial.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-900 font-bold">{testimonial.name}</div>
                    <div className="text-gray-600 text-sm">{testimonial.role} at {testimonial.company}</div>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform duration-300" style={{ transitionDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
        )}
      </section>

      {/* CTA Section with Electric Border */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-20 animate-pulse"></div>
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <h2 className="text-5xl font-bold text-white mb-8">
            Ready to earn more?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
            Join thousands of creators who are already earning more, working with amazing brands, and building their path to financial freedom on Creator Bounty.
          </p>
          <Link 
            to="/login" 
            className="group relative inline-flex items-center px-10 py-5 bg-white text-blue-600 font-bold rounded-xl hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10">Start Earning</span>
            <ChevronRight className="w-6 h-6 ml-2 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Suspense fallback={<OptimizedLoader height="h-32" />}>
        <Footer />
      </Suspense>
    </div>
  )
}

export default Home
