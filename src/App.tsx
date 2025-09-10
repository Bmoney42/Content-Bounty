import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './utils/authUtils'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastProvider } from './components/ui/ToastContainer'
import ErrorBoundary from './components/ui/ErrorBoundary'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import LoadingSpinner from './components/ui/LoadingSpinner'

// Lazy load components for better performance
const Bounties = React.lazy(() => import('./pages/Bounties'))
const CreateBounty = React.lazy(() => import('./pages/CreateBounty'))
const Applications = React.lazy(() => import('./pages/Applications'))
const CreatorPipeline = React.lazy(() => import('./pages/CreatorPipeline'))
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Creators = React.lazy(() => import('./pages/Creators'))
const Profile = React.lazy(() => import('./pages/Profile'))
const Settings = React.lazy(() => import('./pages/Settings'))
const Upgrade = React.lazy(() => import('./pages/Upgrade'))
const ComponentDemo = React.lazy(() => import('./pages/ComponentDemo'))
const OAuthCallback = React.lazy(() => import('./pages/OAuthCallback'))
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'))
const CreatorBanking = React.lazy(() => import('./pages/CreatorBanking'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const DataDeletionInstructions = React.lazy(() => import('./pages/DataDeletionInstructions'))
const TestFeatures = React.lazy(() => import('./pages/TestFeatures'))
const SubscriptionDebug = React.lazy(() => import('./pages/SubscriptionDebug'))
const YouTubeOAuthTest = React.lazy(() => import('./pages/YouTubeOAuthTest'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute default
      gcTime: 5 * 60 * 1000, // 5 minutes default (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 404s or auth errors
        if (error?.code === 'permission-denied' || error?.status === 404) {
          return false
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/bounties" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading bounties..." variant="primary" />}>
              <Bounties />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/bounties/new" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading create bounty..." variant="primary" />}>
              <CreateBounty />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/applications" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading applications..." variant="primary" />}>
              <Applications />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator-pipeline" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading your pipeline..." variant="primary" />}>
              <CreatorPipeline />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading dashboard..." variant="primary" />}>
              <Dashboard />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creators" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading creators..." variant="primary" />}>
              <Creators />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading profile..." variant="primary" />}>
              <Profile />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading settings..." variant="primary" />}>
              <Settings />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/upgrade" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading upgrade..." variant="primary" />}>
              <Upgrade />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/demo" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading demo..." variant="primary" />}>
              <ComponentDemo />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/creator-banking" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading banking setup..." variant="primary" />}>
              <CreatorBanking />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Suspense fallback={<LoadingSpinner size="xl" text="Loading admin dashboard..." variant="primary" />}>
            <AdminDashboard />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/test-features" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading test features..." variant="primary" />}>
              <TestFeatures />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/subscription-debug" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading debug tools..." variant="primary" />}>
              <SubscriptionDebug />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/youtube-oauth-test" element={
        <ProtectedRoute>
          <Layout>
            <Suspense fallback={<LoadingSpinner size="xl" text="Loading YouTube OAuth test..." variant="primary" />}>
              <YouTubeOAuthTest />
            </Suspense>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/oauth/callback" element={
        <Suspense fallback={<LoadingSpinner size="xl" text="Processing authentication..." variant="primary" />}>
          <OAuthCallback />
        </Suspense>
      } />

      <Route path="/privacy" element={
        <Suspense fallback={<LoadingSpinner size="xl" text="Loading privacy policy..." variant="primary" />}>
          <PrivacyPolicy />
        </Suspense>
      } />

      <Route path="/terms" element={
        <Suspense fallback={<LoadingSpinner size="xl" text="Loading terms of service..." variant="primary" />}>
          <TermsOfService />
        </Suspense>
      } />

      <Route path="/data-deletion-instructions" element={
        <Suspense fallback={<LoadingSpinner size="xl" text="Loading data deletion instructions..." variant="primary" />}>
          <DataDeletionInstructions />
        </Suspense>
      } />

    </Routes>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <Router>
                <AppRoutes />
                <Analytics />
                <SpeedInsights />
              </Router>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App