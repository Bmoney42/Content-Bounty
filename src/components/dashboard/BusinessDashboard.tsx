import React from 'react'
import { TrendingUp, Users, DollarSign, Video, Target, Clock } from 'lucide-react'

const BusinessDashboard: React.FC = () => {
  const stats = [
    { label: "Active Bounties", value: "8", icon: Target, color: "blue" },
    { label: "Total Creators", value: "247", icon: Users, color: "green" },
    { label: "Bounties Paid", value: "$4,250", icon: DollarSign, color: "purple" },
    { label: "Videos Created", value: "89", icon: Video, color: "orange" }
  ]

  const recentBounties = [
    { title: "Crypto App Review", creator: "TechReviewer99", status: "completed", payout: 75, date: "2 days ago" },
    { title: "Trading Tutorial", creator: "CryptoTeacher", status: "in-progress", payout: 100, date: "1 week ago" },
    { title: "Product Unboxing", creator: "UnboxMaster", status: "pending", payout: 50, date: "3 days ago" }
  ]

  return (
    <>
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center group hover:bg-white/20 transition-all duration-500 hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-3">{stat.value}</div>
            <div className="text-gray-300 text-sm font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Bounties */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Bounties</h2>
        <div className="space-y-6">
          {recentBounties.map((bounty, index) => (
            <div key={index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{bounty.title}</h3>
                <p className="text-gray-300 font-medium">Creator: {bounty.creator}</p>
                <p className="text-gray-400 text-sm">{bounty.date}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                  bounty.status === 'completed' ? 'bg-green-500 text-white' :
                  bounty.status === 'in-progress' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {bounty.status}
                </span>
                <span className="font-bold text-2xl text-blue-400">${bounty.payout}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default BusinessDashboard
