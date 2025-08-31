import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

    if (!title || !description || !reward) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const bounty = await prisma.bounty.create({
      data: {
        title,
        description,
        reward,
        currency: currency || "USD",
        bountyType: bountyType || "CONTENT_CREATION",
        requirements,
        deadline: deadline ? new Date(deadline) : null,
        maxParticipants: maxParticipants || 1,
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
