"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"

export default function RoleSwitcher() {
  const { data: session, update } = useSession()
  const [isSwitching, setIsSwitching] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleRoleSwitch = async (newRole: "CREATOR" | "BUSINESS") => {
    if (!session?.user || isSwitching) return
    
    setIsSwitching(true)
    
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      })

      if (res.ok) {
        // Update the session to reflect the new role
        await update({
          ...session,
          user: {
            ...session.user,
            role: newRole
          }
        })
        
        // Show success message
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
        
        console.log(`Switched to ${newRole} mode`)
      } else {
        const data = await res.json()
        console.error("Error switching role:", data.error)
        alert(`Error switching role: ${data.error}`)
      }
    } catch (error) {
      console.error("Error switching role:", error)
      alert("Network error occurred while switching roles")
    } finally {
      setIsSwitching(false)
    }
  }

  if (!session?.user) return null

  const currentRole = session.user.role as string

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">Mode:</span>
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        <button
          onClick={() => handleRoleSwitch("CREATOR")}
          disabled={isSwitching}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            currentRole === "CREATOR"
              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          } ${isSwitching ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSwitching && currentRole !== "CREATOR" ? "..." : "Creator"}
        </button>
        <button
          onClick={() => handleRoleSwitch("BUSINESS")}
          disabled={isSwitching}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
            currentRole === "BUSINESS"
              ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          } ${isSwitching ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isSwitching && currentRole !== "BUSINESS" ? "..." : "Business"}
        </button>
      </div>
      
      {showSuccess && (
        <div className="text-sm text-green-600 dark:text-green-400 animate-pulse">
          ✓ Switched successfully
        </div>
      )}
    </div>
  )
}
