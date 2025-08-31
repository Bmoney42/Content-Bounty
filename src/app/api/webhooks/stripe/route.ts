import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object)
        break
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: { metadata: { earningId?: string; userId?: string }; id: string }) {
  const { earningId } = paymentIntent.metadata

  if (!earningId) return

  // Update earning status
  const earning = await prisma.earning.update({
    where: { id: earningId },
    data: { 
      status: "PAID",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntent.id
    },
    include: {
      user: true,
      task: true
    }
  })

  // Create notification
  await prisma.notification.create({
    data: {
      type: "payment_received",
      title: "Payment Received!",
      message: `Your payment of $${earning.amount} ${earning.currency} for "${earning.task.title}" has been processed successfully.`,
      userId: earning.userId,
      relatedId: earning.id,
      relatedType: "earning"
    }
  })
}

async function handlePaymentFailure(paymentIntent: { metadata: { earningId?: string; userId?: string }; id: string }) {
  const { earningId, userId } = paymentIntent.metadata

  if (!earningId) return

  // Update earning status
  await prisma.earning.update({
    where: { id: earningId },
    data: { 
      status: "FAILED",
      stripePaymentIntentId: paymentIntent.id
    }
  })

  // Create notification
  if (userId) {
    await prisma.notification.create({
      data: {
        type: "payment_failed",
        title: "Payment Failed",
        message: "Your payment could not be processed. Please try again or contact support.",
        userId: userId,
        relatedId: earningId,
        relatedType: "earning"
      }
    })
  }
}

async function handlePaymentCanceled(paymentIntent: { metadata: { earningId?: string; userId?: string }; id: string }) {
  const { earningId } = paymentIntent.metadata

  if (!earningId) return

  // Update earning status
  await prisma.earning.update({
    where: { id: earningId },
    data: { 
      status: "CANCELLED",
      stripePaymentIntentId: paymentIntent.id
    }
  })
}
