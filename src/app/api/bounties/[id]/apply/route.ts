import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "CREATOR") {
      return NextResponse.json(
        { error: "Only creators can apply for bounties" },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { message, portfolio } = await req.json()

    // Check if bounty exists and is open
    const bounty = await prisma.bounty.findUnique({
      where: { id: resolvedParams.id },
      include: {
        applications: true
      }
    })

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 })
    }

    if (bounty.status !== "OPEN") {
      return NextResponse.json({ error: "Bounty is not open for applications" }, { status: 400 })
    }

    // Check if user already applied
    const existingApplication = await prisma.bountyApplication.findUnique({
      where: {
        bountyId_userId: {
          bountyId: resolvedParams.id,
          userId: session.user.id
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied for this bounty" }, { status: 400 })
    }

    // Check if bounty has reached max participants
    if (bounty.applications.length >= bounty.maxParticipants) {
      return NextResponse.json({ error: "Bounty has reached maximum participants" }, { status: 400 })
    }

    // Create application
    const application = await prisma.bountyApplication.create({
      data: {
        bountyId: resolvedParams.id,
        userId: session.user.id,
        message: message || "",
        portfolio: portfolio || ""
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            bio: true
          }
        }
      }
    })

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error applying for bounty:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
