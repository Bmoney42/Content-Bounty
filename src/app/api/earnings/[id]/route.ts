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

    const earning = await prisma.earning.findUnique({
      where: { id: resolvedParams.id },
      include: {
        task: {
          select: {
            title: true
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            walletAddress: true
          }
        }
      }
    })

    if (!earning) {
      return NextResponse.json({ error: "Earning not found" }, { status: 404 })
    }

    // Only allow users to view their own earnings
    if (earning.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ earning })
  } catch (error) {
    console.error("Error fetching earning:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
