/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { firebaseAuth, firebaseDB, firebaseTest, User as FirebaseUser } from '../services/firebase'
import { useAuthRateLimit } from '../hooks/useAuthRateLimit'

interface User {
  id: string
  name: string
  email: string
  userType: 'creator' | 'business'
  isAdmin?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (userData: { name: string; email: string; password: string; userType: 'creator' | 'business' }) => Promise<void>
  loading: boolean
  rateLimitInfo: {
    loginBlocked: boolean
    registerBlocked: boolean
    loginAttemptsRemaining: number
    registerAttemptsRemaining: number
  }
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Moved useAuth to utils/authUtils.ts to avoid fast refresh issues

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  
  // Rate limiting
  const {
    loginState,
    registerState,
    checkLoginRateLimit,
    checkRegisterRateLimit,
    recordLoginAttempt,
    recordRegisterAttempt
  } = useAuthRateLimit()

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
            // Don't force a userType - let createUserIfNotExists preserve existing userType
            const userDataPromise = firebaseDB.createUserIfNotExists(firebaseUser)
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
               userType: userData.userType,
               isAdmin: userData.isAdmin || false
             })
             setIsAuthenticated(true)
           } else {
             // Fallback if everything fails
             console.log('Fallback: Creating basic user object')
             // Try to determine user type from email or use creator as fallback
             const inferredUserType = firebaseUser.email?.includes('business') ? 'business' : 'creator'
             setUser({
               id: firebaseUser.uid,
               name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
               email: firebaseUser.email || 'user@example.com',
               userType: inferredUserType
             })
             setIsAuthenticated(true)
           }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Fallback to basic user data from Firebase Auth
          console.log('Using fallback user data from Firebase Auth')
          // Try to determine user type from email or use creator as fallback
          const inferredUserType = firebaseUser.email?.includes('business') ? 'business' : 'creator'
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || 'user@example.com',
            userType: inferredUserType
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
    // Check rate limit before attempting login
    const rateLimitCheck = checkLoginRateLimit(email)
    if (!rateLimitCheck.canProceed) {
      throw new Error(rateLimitCheck.message || 'Too many login attempts. Please try again later.')
    }

    try {
      setLoading(true)
      console.log('Starting login process...')
      await firebaseAuth.login(email, password)
      console.log('Firebase login successful')
      
      // Record successful login attempt
      recordLoginAttempt(email, true)
      
      // The auth state listener will handle setting the user
    } catch (error) {
      console.error('Login error:', error)
      
      // Record failed login attempt
      recordLoginAttempt(email, false)
      
      // Check if we should show rate limit warning
      const newRateLimitCheck = checkLoginRateLimit(email)
      if (newRateLimitCheck.message && rateLimitCheck.canProceed) {
        // Prepend rate limit warning to original error
        const originalMessage = error instanceof Error ? error.message : 'Login failed'
        throw new Error(`${originalMessage}\n\n${newRateLimitCheck.message}`)
      }
      
      // For all other cases, throw the error so the UI can show it
      throw error
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
    // Check rate limit before attempting registration
    const rateLimitCheck = checkRegisterRateLimit(userData.email)
    if (!rateLimitCheck.canProceed) {
      throw new Error(rateLimitCheck.message || 'Too many registration attempts. Please try again later.')
    }

    try {
      setLoading(true)
      console.log('Starting registration process...')
      await firebaseAuth.register(userData.email, userData.password, userData.userType, userData.name)
      console.log('Registration completed successfully')
      
      // Record successful registration attempt
      recordRegisterAttempt(userData.email, true)
      
      // The auth state listener will handle setting the user
    } catch (error) {
      console.error('Registration error:', error)
      
      // Record failed registration attempt
      recordRegisterAttempt(userData.email, false)
      
      // If Firebase Auth succeeded but Firestore failed, we should still authenticate the user
      const currentUser = firebaseAuth.getCurrentUser()
      if (currentUser) {
        console.log('Firebase Auth succeeded, setting user despite Firestore error')
        // This counts as a success, so record it as such
        recordRegisterAttempt(userData.email, true)
        setUser({
          id: currentUser.uid,
          name: userData.name,
          email: userData.email,
          userType: userData.userType
        })
        setIsAuthenticated(true)
      } else {
        // Check if we should show rate limit warning
        const newRateLimitCheck = checkRegisterRateLimit(userData.email)
        if (newRateLimitCheck.message && rateLimitCheck.canProceed) {
          // Prepend rate limit warning to original error
          const originalMessage = error instanceof Error ? error.message : 'Registration failed'
          throw new Error(`${originalMessage}\n\n${newRateLimitCheck.message}`)
        }
        
        // If Firebase Auth also failed, throw the error
        throw error
      }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    register,
    loading,
    rateLimitInfo: {
      loginBlocked: loginState.isBlocked,
      registerBlocked: registerState.isBlocked,
      loginAttemptsRemaining: loginState.remainingAttempts,
      registerAttemptsRemaining: registerState.remainingAttempts
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

