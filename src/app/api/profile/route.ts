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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        socialLinks: true,
        walletAddress: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get earnings for creators
    let earnings: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      createdAt: Date;
      task: { title: string } | null;
    }> = []
    if (user.role === "CREATOR") {
      earnings = await prisma.earning.findMany({
        where: { userId: user.id },
        include: {
          task: {
            select: {
              title: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      })
    }

    return NextResponse.json({ user, earnings })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, bio, socialLinks, walletAddress, role } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    // Validate role if provided
    if (role && !["CREATOR", "BUSINESS", "DEMO"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        bio: bio || null,
        socialLinks: socialLinks || null,
        walletAddress: walletAddress || null,
        ...(role && { role })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        socialLinks: true,
        walletAddress: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// New PATCH method specifically for role switching
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { role } = await req.json()

    if (!role || !["CREATOR", "BUSINESS", "DEMO"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be CREATOR, BUSINESS, or DEMO" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        socialLinks: true,
        walletAddress: true,
        createdAt: true
      }
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: `Successfully switched to ${role} mode`
    })
  } catch (error) {
    console.error("Error switching role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
