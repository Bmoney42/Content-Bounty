import React from 'react'
import { DollarSign, Video, TrendingUp, Users, Eye, Clock } from 'lucide-react'

const CreatorDashboard: React.FC = () => {
  const stats = [
    { label: "Total Earnings", value: "$2,450", icon: DollarSign, color: "green" },
    { label: "Videos Created", value: "23", icon: Video, color: "blue" },
    { label: "Total Views", value: "45.2K", icon: Eye, color: "purple" },
    { label: "Active Bounties", value: "4", icon: Clock, color: "orange" }
  ]

  const recentWork = [
    { title: "Crypto App Review", brand: "CryptoFlow", status: "completed", earnings: 75, views: "12.5K", date: "2 days ago" },
    { title: "Trading Tutorial", brand: "TradeMaster", status: "completed", earnings: 100, views: "8.9K", date: "1 week ago" },
    { title: "Product Unboxing", brand: "TechGear", status: "in-progress", earnings: 50, views: "3.2K", date: "3 days ago" }
  ]

  return (
    <>
      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-8 mb-12">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 text-center group hover:bg-white/20 transition-all duration-500 hover:scale-105">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="w-7 h-7 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-green-400 mb-3">{stat.value}</div>
            <div className="text-gray-300 text-sm font-semibold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Work */}
      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-white mb-8">Recent Work</h2>
        <div className="space-y-6">
          {recentWork.map((work, index) => (
            <div key={index} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{work.title}</h3>
                <p className="text-gray-300 font-medium">Brand: {work.brand}</p>
                <p className="text-gray-400 text-sm">{work.date}</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Views</p>
                  <p className="text-white font-semibold">{work.views}</p>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                  work.status === 'completed' ? 'bg-green-500 text-white' :
                  work.status === 'in-progress' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {work.status}
                </span>
                <span className="font-bold text-2xl text-green-400">${work.earnings}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default CreatorDashboard
