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
        { error: "Only creators can apply for tasks" },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { message } = await req.json()

    // Check if task exists and is open
    const task = await prisma.task.findUnique({
      where: { id: resolvedParams.id },
      include: {
        applications: true
      }
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    if (task.status !== "OPEN") {
      return NextResponse.json({ error: "Task is not open for applications" }, { status: 400 })
    }

    // Check if user already applied
    const existingApplication = await prisma.taskApplication.findUnique({
      where: {
        taskId_userId: {
          taskId: resolvedParams.id,
          userId: session.user.id
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json({ error: "You have already applied for this task" }, { status: 400 })
    }

    // Check if task has reached max participants
    if (task.applications.length >= task.maxParticipants) {
      return NextResponse.json({ error: "Task has reached maximum participants" }, { status: 400 })
    }

    // Create application
    const application = await prisma.taskApplication.create({
      data: {
        taskId: resolvedParams.id,
        userId: session.user.id,
        message: message || ""
      },
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

    return NextResponse.json(application, { status: 201 })
  } catch (error) {
    console.error("Error applying for task:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}