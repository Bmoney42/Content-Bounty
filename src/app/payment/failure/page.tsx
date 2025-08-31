'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PaymentFailurePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center'>
        <div className='mb-6'>
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100'>
            <svg className='h-6 w-6 text-red-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
            </svg>
          </div>
        </div>
        
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Payment Failed</h1>
        <p className='text-gray-600 mb-6'>
          Unfortunately, your payment could not be processed. Please try again or contact support if the problem persists.
        </p>
        
        <div className='space-y-3'>
          <button
            onClick={() => router.push('/dashboard')}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.back()}
            className='w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors'
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
