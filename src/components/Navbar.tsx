"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import Link from "next/link"
import RoleSwitcher from "./RoleSwitcher"

export default function Navbar() {
  const { data: session, status } = useSession()

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-purple-600">
            SponsorHub
          </Link>
          
          <div className="flex items-center space-x-4">
            {status === "loading" && (
              <div className="text-gray-500">Loading...</div>
            )}
            
            {status === "unauthenticated" && (
              <>
                <button
                  onClick={() => signIn()}
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Sign In
                </button>
                <Link
                  href="/signup"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            {status === "authenticated" && session?.user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-purple-600 transition-colors"
                >
                  Dashboard
                </Link>
                <RoleSwitcher />
                <div className="flex items-center space-x-2">
                  {session.user?.image && (
                    <img
                      src={session.user.image}
                      alt="Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-600 hover:text-red-600 transition-colors ml-2"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}