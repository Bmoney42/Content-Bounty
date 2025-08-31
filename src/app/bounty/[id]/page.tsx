"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface Bounty {
  id: string
  title: string
  description: string
  reward: number
  currency: string
  status: string
  bountyType: string
  requirements?: string
  deadline?: string
  maxParticipants: number
  currentParticipants: number
  createdAt: string
  business: {
    name: string
    bio?: string
  }
}

interface Application {
  id: string
  message: string
  portfolio?: string
  status: string
  createdAt: string
  user: {
    name: string
    email: string
    bio?: string
  }
}

export default function BountyDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applicationForm, setApplicationForm] = useState({
    message: "",
    portfolio: ""
  })
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [bountyId, setBountyId] = useState<string>("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setBountyId(resolvedParams.id)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (session?.user && bountyId) {
      fetchBounty()
    }
  }, [session, bountyId])

  const fetchBounty = async () => {
    try {
      const res = await fetch(`/api/bounties/${bountyId}`)
      if (res.ok) {
        const data = await res.json()
        setBounty(data.bounty)
        setApplications(data.applications || [])
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching bounty:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    setApplying(true)

    try {
      const res = await fetch(`/api/bounties/${bountyId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationForm)
      })

      if (res.ok) {
        alert("Application submitted successfully!")
        setShowApplicationForm(false)
        setApplicationForm({ message: "", portfolio: "" })
        fetchBounty() // Refresh to show updated application count
      } else {
        const data = await res.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error applying:", error)
      alert("Network error occurred")
    } finally {
      setApplying(false)
    }
  }

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/bounties/${params.id}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === 'approve' ? 'APPROVED' : 'REJECTED' })
      })

      if (res.ok) {
        alert(`Application ${action}d successfully!`)
        fetchBounty()
      } else {
        const data = await res.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error updating application:", error)
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

  if (!bounty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Bounty Not Found</h1>
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isCreator = session?.user?.role === "CREATOR"
  const isBusiness = session?.user?.role === "BUSINESS"
  const isOwner = isBusiness && bounty.business.name === session?.user?.name
  const hasApplied = applications.some(app => app.user.email === session?.user?.email)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {bounty.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Posted by {bounty.business.name}</span>
            <span>•</span>
            <span>{new Date(bounty.createdAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              bounty.status === "OPEN" 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-800"
            }`}>
              {bounty.status}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bounty Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Description
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">
                {bounty.description}
              </p>

              {bounty.requirements && (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Requirements
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">
                    {bounty.requirements}
                  </p>
                </>
              )}

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {bounty.bountyType.replace(/_/g, ' ')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Participants:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {bounty.currentParticipants}/{bounty.maxParticipants}
                  </span>
                </div>
                {bounty.deadline && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Deadline:</span>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Application Form for Creators */}
            {isCreator && bounty.status === "OPEN" && !hasApplied && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Apply for this Bounty
                  </h2>
                  <button
                    onClick={() => setShowApplicationForm(!showApplicationForm)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {showApplicationForm ? "Cancel" : "Apply Now"}
                  </button>
                </div>

                {showApplicationForm && (
                  <form onSubmit={handleApply} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Why should we choose you?
                      </label>
                      <textarea
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={applicationForm.message}
                        onChange={(e) => setApplicationForm({...applicationForm, message: e.target.value})}
                        placeholder="Tell us about your experience and why you're perfect for this bounty..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Portfolio/Previous Work (Optional)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        value={applicationForm.portfolio}
                        onChange={(e) => setApplicationForm({...applicationForm, portfolio: e.target.value})}
                        placeholder="Share links to your previous work, social media, or portfolio..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={applying}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {applying ? "Submitting..." : "Submit Application"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Applications Management for Business Owners */}
            {isOwner && applications.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Applications ({applications.length})
                </h2>
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {application.user.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {application.user.email}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          application.status === "PENDING" 
                            ? "bg-yellow-100 text-yellow-800"
                            : application.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {application.status}
                        </span>
                      </div>
                      
                      {application.user.bio && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                          {application.user.bio}
                        </p>
                      )}
                      
                      {application.message && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                          {application.message}
                        </p>
                      )}
                      
                      {application.portfolio && (
                        <p className="text-gray-600 dark:text-gray-400 mb-2 text-sm">
                          <span className="font-medium">Portfolio:</span> {application.portfolio}
                        </p>
                      )}
                      
                      {application.status === "PENDING" && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => handleApplicationAction(application.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reward Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Reward
              </h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${bounty.reward} {bounty.currency}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payment will be processed upon completion
              </p>
            </div>

            {/* Business Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                About {bounty.business.name}
              </h3>
              {bounty.business.bio ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {bounty.business.bio}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-500 text-sm">
                  No bio available
                </p>
              )}
            </div>

            {/* Status Info */}
            {isCreator && hasApplied && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Application Status
                </h3>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  You have applied for this bounty. The business will review your application.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
