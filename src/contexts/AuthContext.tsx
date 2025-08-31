import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { firebaseAuth, firebaseDB, firebaseTest, User as FirebaseUser } from '../services/firebase'

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
    // Test Firestore connection on app start
    firebaseTest.testConnection().then(isConnected => {
      if (!isConnected) {
        console.warn('⚠️ Firestore connection issues detected. App will use fallback mode.')
      }
    })

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
                 try {
           console.log('Firebase user authenticated, fetching user data...')
                       // Try to get or create user data from Firestore with timeout
            const userDataPromise = firebaseDB.createUserIfNotExists(firebaseUser, 'creator')
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Firestore timeout')), 3000)
            )
           
           const userData = await Promise.race([userDataPromise, timeoutPromise]) as any
           
           if (userData) {
             console.log('User data fetched/created successfully from Firestore')
             setUser({
               id: userData.uid,
               name: userData.displayName || userData.email.split('@')[0],
               email: userData.email,
               userType: userData.userType
             })
             setIsAuthenticated(true)
           } else {
             // Fallback if everything fails
             console.log('Fallback: Creating basic user object')
             setUser({
               id: firebaseUser.uid,
               name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
               email: firebaseUser.email || 'user@example.com',
               userType: 'creator' // Default to creator
             })
             setIsAuthenticated(true)
           }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to basic user data from Firebase Auth
          console.log('Using fallback user data from Firebase Auth')
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || 'user@example.com',
            userType: 'creator' // Default to creator
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
      console.log('Starting login process...')
      await firebaseAuth.login(email, password)
      console.log('Firebase login successful')
      // The auth state listener will handle setting the user
    } catch (error) {
      console.error('Login error:', error)
      // Only fallback to demo login for demo accounts
      if (email === 'creator@demo.com' && password === 'password') {
        setUser({
          id: '1',
          name: 'John Doe',
          email: email,
          userType: 'creator'
        })
        setIsAuthenticated(true)
      } else if (email === 'business@demo.com' && password === 'password') {
        setUser({
          id: '2',
          name: 'Jane Smith',
          email: email,
          userType: 'business'
        })
        setIsAuthenticated(true)
      } else {
        // For real accounts, throw the error so the UI can show it
        throw error
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
      console.log('Starting registration process...')
      await firebaseAuth.register(userData.email, userData.password, userData.userType, userData.name)
      console.log('Registration completed successfully')
      // The auth state listener will handle setting the user
    } catch (error) {
      console.error('Registration error:', error)
      // If Firebase Auth succeeded but Firestore failed, we should still authenticate the user
      const currentUser = firebaseAuth.getCurrentUser()
      if (currentUser) {
        console.log('Firebase Auth succeeded, setting user despite Firestore error')
        setUser({
          id: currentUser.uid,
          name: userData.name,
          email: userData.email,
          userType: userData.userType
        })
        setIsAuthenticated(true)
      } else {
        // If Firebase Auth also failed, throw the error
        throw error
      }
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

