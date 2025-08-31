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

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        tasks: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(campaigns)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
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

    if (session.user.role !== "BRAND") {
      return NextResponse.json(
        { error: "Only brands can create campaigns" },
        { status: 403 }
      )
    }

    const { title, description, budget, currency, tasks } = await req.json()

    if (!title || !description || !budget || !tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        budget,
        currency: currency || "USD",
        userId: session.user.id,
        tasks: {
          create: tasks.map((task: { title: string; description: string; reward: number; maxParticipants?: number }) => ({
            title: task.title,
            description: task.description,
            reward: task.reward,
            currency: currency || "USD",
            maxParticipants: task.maxParticipants || 1
          }))
        }
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error("Error creating campaign:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}