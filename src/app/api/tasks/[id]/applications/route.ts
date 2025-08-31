import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params

    // Verify the task belongs to the user's campaign (for brands)
    const task = await prisma.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        campaign: true,
        applications: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                bio: true,
                socialLinks: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Only brand owners can see applications
    if (session.user.role !== "BRAND" || task.campaign.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(task.applications)
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const { applicationId, status } = await req.json()

    if (!applicationId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the task belongs to the user's campaign
    const task = await prisma.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        campaign: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (session.user.role !== "BRAND" || task.campaign.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update application status
    const updatedApplication = await prisma.taskApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // If approved and task allows assignment, assign the user
    if (status === "APPROVED") {
      await prisma.task.update({
        where: { id: resolvedParams.id },
        data: { 
          assignedTo: updatedApplication.userId,
          status: "IN_PROGRESS"
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