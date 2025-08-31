import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; applicationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const resolvedParams = await params
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "BUSINESS") {
      return NextResponse.json(
        { error: "Only businesses can manage applications" },
        { status: 403 }
      )
    }

    const { status } = await req.json()

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    // Verify the bounty belongs to the business
    const bounty = await prisma.bounty.findUnique({
      where: { id: resolvedParams.id },
      include: {
        applications: true
      }
    })

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 })
    }

    if (bounty.businessId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only manage applications for your own bounties" },
        { status: 403 }
      )
    }

    // Verify the application exists
    const application = await prisma.bountyApplication.findUnique({
      where: { id: resolvedParams.applicationId }
    })

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (application.bountyId !== resolvedParams.id) {
      return NextResponse.json(
        { error: "Application does not belong to this bounty" },
        { status: 400 }
      )
    }

    // Update application status
    const updatedApplication = await prisma.bountyApplication.update({
      where: { id: resolvedParams.applicationId },
      data: { status },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // If approved, assign the bounty to the user and update bounty status
    if (status === "APPROVED") {
      await prisma.bounty.update({
        where: { id: resolvedParams.id },
        data: {
          assignedTo: application.userId,
          status: "IN_PROGRESS"
        }
      })

      // Create an earning record
      await prisma.earning.create({
        data: {
          amount: bounty.reward,
          currency: bounty.currency,
          status: "PENDING",
          userId: application.userId,
          taskId: resolvedParams.id // Using taskId field for bounty
        }
      })
    }

    return NextResponse.json(updatedApplication)
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
