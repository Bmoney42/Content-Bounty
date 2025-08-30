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
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    userType: 'creator'
  })
  const [isAuthenticated, setIsAuthenticated] = useState(true)

  const login = async (email: string, password: string) => {
    // Simulate login - check if it's a demo account
    if (email === 'creator@demo.com') {
      setUser({
        id: '1',
        name: 'John Doe',
        email: email,
        userType: 'creator'
      })
    } else if (email === 'business@demo.com') {
      setUser({
        id: '2',
        name: 'Jane Smith',
        email: email,
        userType: 'business'
      })
    } else {
      // Default to creator for any other email
      setUser({
        id: '1',
        name: 'John Doe',
        email: email,
        userType: 'creator'
      })
    }
    setIsAuthenticated(true)
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
  }

  const register = async (userData: { name: string; email: string; password: string; userType: 'creator' | 'business' }) => {
    // Simulate registration
    setUser({
      id: '1',
      name: userData.name,
      email: userData.email,
      userType: userData.userType
    })
    setIsAuthenticated(true)
  }

  const switchUserType = (userType: 'creator' | 'business') => {
    if (user) {
      setUser({
        ...user,
        userType: userType
      })
    }
  }

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    switchUserType
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

