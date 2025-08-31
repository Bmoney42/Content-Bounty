"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, use } from "react"

interface Campaign {
  id: string
  title: string
  description: string
  budget: number
  currency: string
  status: string
  createdAt: string
  tasks: Task[]
}

interface Task {
  id: string
  title: string
  description: string
  reward: number
  currency: string
  status: string
  maxParticipants: number
  currentParticipants: number
  applications?: TaskApplication[]
}

interface TaskApplication {
  id: string
  status: string
  createdAt: string
  message: string
  user: {
    id: string
    name: string
    email: string
    bio?: string
  }
}

export default function CampaignDetails({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<string | null>(null)
  const [taskApplications, setTaskApplications] = useState<TaskApplication[]>([])
  const resolvedParams = use(params)

  useEffect(() => {
    fetchCampaign()
  }, [resolvedParams.id])

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setCampaign(data)
      }
    } catch (error) {
      console.error("Error fetching campaign:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateCampaignStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/campaigns/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      
      if (res.ok) {
        setCampaign(prev => prev ? { ...prev, status } : null)
      }
    } catch (error) {
      console.error("Error updating campaign:", error)
    }
  }

  const fetchTaskApplications = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/applications`)
      if (res.ok) {
        const data = await res.json()
        setTaskApplications(data)
        setSelectedTask(taskId)
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    }
  }

  const handleApplicationStatusUpdate = async (applicationId: string, status: string, taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/applications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status })
      })

      if (res.ok) {
        // Refresh applications
        fetchTaskApplications(taskId)
        // Refresh campaign data
        fetchCampaign()
      }
    } catch (error) {
      console.error("Error updating application:", error)
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
        // Refresh the campaign data to show updated participant count
        fetchCampaign()
      } else {
        const data = await res.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error applying for task:", error)
      alert("Network error occurred")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 hover:text-purple-700 mb-4"
          >
            ← Back to Dashboard
          </button>
          
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {campaign.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Created on {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                campaign.status === "ACTIVE" 
                  ? "bg-green-100 text-green-800" 
                  : campaign.status === "PAUSED"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {campaign.status}
              </span>
              
              {session?.user?.role === "BRAND" && (
                <div className="flex space-x-2">
                  {campaign.status === "ACTIVE" && (
                    <button
                      onClick={() => updateCampaignStatus("PAUSED")}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm"
                    >
                      Pause
                    </button>
                  )}
                  {campaign.status === "PAUSED" && (
                    <button
                      onClick={() => updateCampaignStatus("ACTIVE")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => updateCampaignStatus("COMPLETED")}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md text-sm"
                  >
                    Complete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-purple-600">Total Budget</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${campaign.budget} {campaign.currency}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-green-600">Total Tasks</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {campaign.tasks.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-2 text-blue-600">Active Tasks</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {campaign.tasks.filter(task => task.status === "OPEN").length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Campaign Description
            </h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {campaign.description}
            </p>
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Campaign Tasks
            </h2>
          </div>
          
          <div className="p-6">
            {campaign.tasks.length > 0 ? (
              <div className="space-y-4">
                {campaign.tasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {task.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ${task.reward} {task.currency}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.status === "OPEN" 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {task.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>
                        Participants: {task.currentParticipants}/{task.maxParticipants}
                      </span>
                      <div className="flex space-x-2">
                        {session?.user?.role === "CREATOR" && task.status === "OPEN" && (
                          <button 
                            onClick={() => handleApplyForTask(task.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition-colors"
                          >
                            Apply for Task
                          </button>
                        )}
                        {session?.user?.role === "BRAND" && (
                          <button 
                            onClick={() => fetchTaskApplications(task.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                          >
                            View Applications
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No tasks have been created for this campaign.
                </p>
              </div>
            )}
          </div>
        </div>

        {selectedTask && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Task Applications
                </h2>
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {taskApplications.length > 0 ? (
                <div className="space-y-4">
                  {taskApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {application.user.name}
                        </h3>
                        <p className="text-sm text-gray-500">{application.user.email}</p>
                        {application.user.bio && (
                          <p className="text-sm text-gray-600 mt-1">{application.user.bio}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          application.status === "PENDING" 
                            ? "bg-yellow-100 text-yellow-800"
                            : application.status === "APPROVED"
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {application.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {application.message && (
                      <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
                        &quot;{application.message}&quot;
                      </p>
                    )}
                    
                    {application.status === "PENDING" && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApplicationStatusUpdate(application.id, "APPROVED", selectedTask)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplicationStatusUpdate(application.id, "REJECTED", selectedTask)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    No applications for this task yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}