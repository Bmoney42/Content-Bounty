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
    const resolvedParams = await params
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bounty = await prisma.bounty.findUnique({
      where: { id: resolvedParams.id },
      include: {
        business: {
          select: {
            name: true,
            bio: true
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
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    })

    if (!bounty) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 })
    }

    // Update current participants count
    const currentParticipants = bounty.applications.filter(app => app.status === "APPROVED").length

    // Only show applications to the bounty owner
    const applications = session.user.role === "BUSINESS" && 
                       bounty.businessId === session.user.id 
                       ? bounty.applications 
                       : []

    return NextResponse.json({
      bounty: {
        ...bounty,
        currentParticipants
      },
      applications
    })
  } catch (error) {
    console.error("Error fetching bounty:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
