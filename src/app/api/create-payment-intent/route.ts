import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, currency = 'usd', earningId } = await req.json()

    if (!amount || !earningId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate the earning exists and belongs to the user
    const earning = await prisma.earning.findUnique({
      where: { id: earningId },
      include: {
        user: true,
        task: true
      }
    })

    if (!earning) {
      return NextResponse.json(
        { error: 'Earning not found' },
        { status: 404 }
      )
    }

    if (earning.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this earning' },
        { status: 403 }
      )
    }

    if (earning.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Payment has already been processed' },
        { status: 400 }
      )
    }

    // Validate amount matches the earning
    if (earning.amount !== amount) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: session.user.id,
        earningId: earning.id,
        taskId: earning.taskId,
        taskTitle: earning.task?.title || 'Unknown Task',
        platform: 'creatorbounty.xyz'
      },
      description: `Payment for: ${earning.task?.title || 'Unknown Task'}`,
      receipt_email: session.user.email || undefined,
    })

    // Update earning status to indicate payment is being processed
    await prisma.earning.update({
      where: { id: earningId },
      data: { 
        status: 'PROCESSING'
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency
    })
  } catch (error) {
    console.error('Payment intent error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
