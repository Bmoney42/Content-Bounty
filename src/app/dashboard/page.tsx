"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Notifications from "@/components/Notifications"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Campaign {
  id: string
  title: string
  description: string
  budget: number
  currency: string
  status: string
  createdAt: string
}

interface Task {
  id: string
  title: string
  description: string
  reward: number
  currency: string
  status: string
  campaign: {
    title: string
  }
  business?: {
    name: string
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signup")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      if (session?.user?.role === "BUSINESS") {
        const res = await fetch("/api/campaigns")
        const data = await res.json()
        setCampaigns(data)
      } else if (session?.user?.role === "CREATOR") {
        const res = await fetch("/api/bounties")
        const data = await res.json()
        setTasks(data)
      } else if (session?.user?.role === "DEMO") {
        // Demo users can see both campaigns and bounties
        const [campaignsRes, bountiesRes] = await Promise.all([
          fetch("/api/campaigns"),
          fetch("/api/bounties")
        ])
        const campaignsData = await campaignsRes.json()
        const bountiesData = await bountiesRes.json()
        setCampaigns(campaignsData)
        setTasks(bountiesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApplyForTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "" })
      })

      if (res.ok) {
        alert("Application submitted successfully!")
        // Refresh the tasks list
        fetchData()
      } else {
        const data = await res.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error applying for task:", error)
      alert("Network error occurred")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const isCreator = (session.user as { role?: string })?.role === "CREATOR"
  const isBusiness = (session.user as { role?: string })?.role === "BUSINESS"
  const isDemo = (session.user as { role?: string })?.role === "DEMO"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {session.user?.name}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isCreator 
                  ? "Find new bounty opportunities and track your earnings" 
                  : isBusiness 
                  ? "Manage your bounties and connect with creators"
                  : "Explore both creator and business features"
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Notifications />
              <button
                onClick={() => router.push("/profile")}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Profile
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-purple-600">
              {isCreator ? "Available Bounties" : isBusiness ? "Active Bounties" : "Available Bounties"}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {isCreator ? tasks.length : isBusiness ? campaigns.length : tasks.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-green-600">
              {isCreator ? "Total Earnings" : isBusiness ? "Total Spent" : "Total Earnings"}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              $0.00
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">
              {isCreator ? "Completed Bounties" : isBusiness ? "Active Bounties" : "Completed Bounties"}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              0
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isCreator ? "Available Bounties" : isBusiness ? "Your Bounties" : "Available Bounties"}
              </h2>
              {isBusiness && (
                <button 
                  onClick={() => router.push("/create-bounty")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Bounty
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {isCreator || isDemo ? (
              tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ${task.reward} {task.currency}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {task.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Business: {task.business?.name || "Unknown"}
                        </span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => router.push(`/bounty/${task.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleApplyForTask(task.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No bounties available at the moment. Check back later!
                  </p>
                </div>
              )
            ) : isBusiness ? (
              campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {campaign.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          campaign.status === "ACTIVE" 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {campaign.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          Budget: ${campaign.budget} {campaign.currency}
                        </span>
                        <button 
                          onClick={() => router.push(`/bounty/${campaign.id}`)}
                          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    You haven&apos;t created any bounties yet.
                  </p>
                  <button 
                    onClick={() => router.push("/create-bounty")}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Create Your First Bounty
                  </button>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}