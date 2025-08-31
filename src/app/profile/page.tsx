"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface User {
  id: string
  name: string
  email: string
  role: string
  bio?: string
  socialLinks?: string
  walletAddress?: string
  createdAt: string
}

interface Earning {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  task: {
    title: string
  }
}

export default function Profile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    socialLinks: "",
    walletAddress: ""
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setEarnings(data.earnings || [])
        setFormData({
          name: data.user.name || "",
          bio: data.user.bio || "",
          socialLinks: data.user.socialLinks || "",
          walletAddress: data.user.walletAddress || ""
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        alert("Profile updated successfully!")
        setEditing(false)
        fetchProfile()
      } else {
        const data = await res.json()
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Network error occurred")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
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

  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0)
  const pendingEarnings = earnings.filter(e => e.status === "PENDING").reduce((sum, earning) => sum + earning.amount, 0)
  const paidEarnings = earnings.filter(e => e.status === "PAID").reduce((sum, earning) => sum + earning.amount, 0)

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
            Profile
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {editing ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Social Links
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.socialLinks}
                      onChange={(e) => setFormData({...formData, socialLinks: e.target.value})}
                      placeholder="Instagram, Twitter, YouTube, etc..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Wallet Address (Optional)
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.walletAddress}
                      onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                      placeholder="0x..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{user.role}</span>
                  </div>
                  {user.bio && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Bio:</span>
                      <p className="mt-1 text-gray-900 dark:text-white">{user.bio}</p>
                    </div>
                  )}
                  {user.socialLinks && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Social Links:</span>
                      <p className="mt-1 text-gray-900 dark:text-white">{user.socialLinks}</p>
                    </div>
                  )}
                  {user.walletAddress && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Wallet Address:</span>
                      <p className="mt-1 text-gray-900 dark:text-white font-mono text-sm">{user.walletAddress}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Member since:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Earnings History (for creators) */}
            {user.role === "CREATOR" && earnings.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Earnings History
                </h2>
                <div className="space-y-3">
                  {earnings.map((earning) => (
                    <div key={earning.id} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {earning.task.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(earning.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          ${earning.amount} {earning.currency}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          earning.status === "PENDING" 
                            ? "bg-yellow-100 text-yellow-800"
                            : earning.status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {earning.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Statistics
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user.role === "CREATOR" ? earnings.length : "N/A"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {user.role === "CREATOR" ? "Completed Bounties" : "Created Bounties"}
                  </div>
                </div>
                {user.role === "CREATOR" && (
                  <>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        ${totalEarnings.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total Earnings
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        ${pendingEarnings.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Pending Payments
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        ${paidEarnings.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Paid Out
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Account Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Account Type:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{user.role}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Member Since:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
