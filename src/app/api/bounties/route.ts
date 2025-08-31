import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { InputValidator } from "@/lib/validation"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For creators, show available bounties
    if (session.user.role === "CREATOR" || session.user.role === "DEMO") {
      const bounties = await prisma.bounty.findMany({
        where: {
          status: "OPEN"
        },
        include: {
          business: {
            select: {
              name: true,
              bio: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return NextResponse.json(bounties)
    }

    // For businesses, show their bounties
    if (session.user.role === "BUSINESS") {
      const bounties = await prisma.bounty.findMany({
        where: {
          businessId: session.user.id
        },
        include: {
          assignedUser: {
            select: {
              name: true,
              email: true
            }
          },
          applications: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  bio: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return NextResponse.json(bounties)
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("Error fetching bounties:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Only businesses can create bounties" },
        { status: 403 }
      )
    }

    const { 
      title, 
      description, 
      reward, 
      currency, 
      bountyType, 
      requirements, 
      deadline,
      maxParticipants 
    } = await req.json()

    // Validate and sanitize inputs
    const titleValidation = InputValidator.validateBountyTitle(title)
    if (!titleValidation.isValid) {
      return NextResponse.json(
        { error: titleValidation.error },
        { status: 400 }
      )
    }

    const descriptionValidation = InputValidator.validateBountyDescription(description)
    if (!descriptionValidation.isValid) {
      return NextResponse.json(
        { error: descriptionValidation.error },
        { status: 400 }
      )
    }

    const rewardValidation = InputValidator.validateAmount(reward)
    if (!rewardValidation.isValid) {
      return NextResponse.json(
        { error: rewardValidation.error },
        { status: 400 }
      )
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    const sanitizedCurrency = validCurrencies.includes(currency) ? currency : 'USD'

    // Validate bounty type
    const validBountyTypes = ['CONTENT_CREATION', 'PRODUCT_REVIEW', 'SOCIAL_MEDIA_POST', 'VIDEO_CREATION', 'PHOTOGRAPHY', 'INFLUENCER_MARKETING', 'CUSTOM']
    const sanitizedBountyType = validBountyTypes.includes(bountyType) ? bountyType : 'CONTENT_CREATION'

    // Validate max participants
    const sanitizedMaxParticipants = Math.min(Math.max(parseInt(maxParticipants) || 1, 1), 100)

    // Validate deadline
    let sanitizedDeadline = null
    if (deadline) {
      const deadlineDate = new Date(deadline)
      if (!isNaN(deadlineDate.getTime()) && deadlineDate > new Date()) {
        sanitizedDeadline = deadlineDate
      }
    }

    // Sanitize requirements
    const sanitizedRequirements = requirements ? InputValidator.sanitizeString(requirements) : null

    const bounty = await prisma.bounty.create({
      data: {
        title: titleValidation.sanitizedValue!,
        description: descriptionValidation.sanitizedValue!,
        reward: parseFloat(rewardValidation.sanitizedValue!),
        currency: sanitizedCurrency,
        bountyType: sanitizedBountyType,
        requirements: sanitizedRequirements,
        deadline: sanitizedDeadline,
        maxParticipants: sanitizedMaxParticipants,
        businessId: session.user.id
      }
    })

    return NextResponse.json(bounty, { status: 201 })
  } catch (error) {
    console.error("Error creating bounty:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
