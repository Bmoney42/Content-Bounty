'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PaymentSuccessPage() {
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
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100'>
            <svg className='h-6 w-6 text-green-600' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
          </div>
        </div>
        
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>Payment Successful!</h1>
        <p className='text-gray-600 mb-6'>
          Your payment has been processed successfully. You will receive a confirmation email shortly.
        </p>
        
        <div className='space-y-3'>
          <button
            onClick={() => router.push('/dashboard')}
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors'
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/profile')}
            className='w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors'
          >
            View Earnings
          </button>
        </div>
      </div>
    </div>
  )
}
