import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { firebaseAuth, firebaseDB, User as FirebaseUser } from '../services/firebase'

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
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await firebaseDB.getUser(firebaseUser.uid)
          if (userData) {
            setUser({
              id: userData.uid,
              name: userData.displayName || userData.email.split('@')[0],
              email: userData.email,
              userType: userData.userType
            })
            setIsAuthenticated(true)
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to demo user for now
          setUser({
            id: '1',
            name: 'John Doe',
            email: firebaseUser.email || 'user@example.com',
            userType: 'creator'
          })
          setIsAuthenticated(true)
        }
      } else {
        setUser(null)
        setIsAuthenticated(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      await firebaseAuth.login(email, password)
      // The auth state listener will handle setting the user
    } catch (error) {
      console.error('Login error:', error)
      // Fallback to demo login for now
      if (email === 'creator@demo.com') {
        setUser({
          id: '1',
          name: 'John Doe',
          email: email,
          userType: 'creator'
        })
        setIsAuthenticated(true)
      } else if (email === 'business@demo.com') {
        setUser({
          id: '2',
          name: 'Jane Smith',
          email: email,
          userType: 'business'
        })
        setIsAuthenticated(true)
      } else {
        // Default to creator for any other email
        setUser({
          id: '1',
          name: 'John Doe',
          email: email,
          userType: 'creator'
        })
        setIsAuthenticated(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await firebaseAuth.logout()
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback logout
      setUser(null)
      setIsAuthenticated(false)
    }
  }

  const register = async (userData: { name: string; email: string; password: string; userType: 'creator' | 'business' }) => {
    try {
      setLoading(true)
      await firebaseAuth.register(userData.email, userData.password, userData.userType, userData.name)
      // The auth state listener will handle setting the user
    } catch (error) {
      console.error('Registration error:', error)
      // Fallback to demo registration
      setUser({
        id: '1',
        name: userData.name,
        email: userData.email,
        userType: userData.userType
      })
      setIsAuthenticated(true)
    } finally {
      setLoading(false)
    }
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
    switchUserType,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

