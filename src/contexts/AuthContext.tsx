import React, { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  userType: 'creator' | 'business'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: { name: string; email: string; password: string; userType: 'creator' | 'business' }) => Promise<void>
  switchUserType: (userType: 'creator' | 'business') => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(false)

  const login = async (email: string, password: string) => {
    // Placeholder - will be replaced with NextAuth
    console.log('Login placeholder:', { email, password })
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  const register = async (userData: { name: string; email: string; password: string; userType: 'creator' | 'business' }) => {
    // Placeholder - will be replaced with NextAuth
    console.log('Register placeholder:', userData)
  }

  const switchUserType = (userType: 'creator' | 'business') => {
    if (user) {
      setUser({ ...user, userType })
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    switchUserType,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

