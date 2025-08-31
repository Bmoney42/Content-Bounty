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

    // For creators, show available tasks
    if (session.user.role === "CREATOR") {
      const tasks = await prisma.task.findMany({
        where: {
          status: "OPEN"
        },
        include: {
          campaign: {
            select: {
              title: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })

      return NextResponse.json(tasks)
    }

    // For brands, show their campaign tasks
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        tasks: {
          include: {
            assignedUser: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    const tasks = campaigns.flatMap(campaign => campaign.tasks)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
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

    const { title, description, reward, currency, campaignId } = await req.json()

    if (!title || !description || !reward || !campaignId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the campaign belongs to the user
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign || campaign.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Campaign not found or unauthorized" },
        { status: 404 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        reward,
        currency: currency || "USD",
        campaignId
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}