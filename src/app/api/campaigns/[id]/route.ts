import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const campaign = await prisma.campaign.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tasks: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error("Error fetching campaign:", error)
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
    const { status, title, description, budget } = await req.json()

    // Verify the campaign belongs to the user
    const campaign = await prisma.campaign.findUnique({
      where: { id: resolvedParams.id }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (campaign.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: resolvedParams.id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(description && { description }),
        ...(budget && { budget })
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json(updatedCampaign)
  } catch (error) {
    console.error("Error updating campaign:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}