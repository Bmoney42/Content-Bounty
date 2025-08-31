"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Earning {
  id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  task: {
    title: string
  }
  user: {
    name: string
    email: string
    walletAddress?: string
  }
}

function PaymentForm({ earning }: { earning: Earning }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      // Create payment intent
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: earning.amount,
          currency: earning.currency.toLowerCase(),
          earningId: earning.id
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create payment intent')
      }

      const { clientSecret } = await res.json()

      // Confirm payment
      const { error: paymentError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      })

      if (paymentError) {
        setError(paymentError.message || 'Payment failed')
      } else {
        // Payment successful
        router.push('/payment/success')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
      >
        {processing ? 'Processing...' : `Pay $${earning.amount} ${earning.currency}`}
      </button>
    </form>
  )
}

export default function PaymentPage({ params }: { params: { earningId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [earning, setEarning] = useState<Earning | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchEarning()
    }
  }, [session, params.earningId])

  const fetchEarning = async () => {
    try {
      const res = await fetch(`/api/earnings/${params.earningId}`)
      if (res.ok) {
        const data = await res.json()
        setEarning(data.earning)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("Error fetching earning:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!earning) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Earning Not Found</h1>
          <button 
            onClick={() => router.push("/dashboard")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  if (earning.status === "PAID") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm text-center">
            <div className="text-green-500 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Completed!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your payment of ${earning.amount} {earning.currency} has been processed successfully.
            </p>
            <button 
              onClick={() => router.push("/dashboard")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-purple-600 hover:text-purple-700 mb-4 flex items-center"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Complete Payment
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          {/* Earning Details */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Bounty Completion
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Bounty:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{earning.task.title}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Amount:</span>
                <span className="ml-2 text-2xl font-bold text-green-600">
                  ${earning.amount} {earning.currency}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  earning.status === "PENDING" 
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-green-100 text-green-800"
                }`}>
                  {earning.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Completed:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {new Date(earning.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          {earning.status === "PENDING" ? (
            <Elements stripe={stripePromise}>
              <PaymentForm earning={earning} />
            </Elements>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                This payment has already been processed.
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
              Secure Payment
            </h4>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              All payments are processed securely through Stripe. Your payment information is encrypted and never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
