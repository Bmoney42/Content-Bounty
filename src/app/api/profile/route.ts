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
      task: { title: string };
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

    const { name, bio, socialLinks, walletAddress } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        bio: bio || null,
        socialLinks: socialLinks || null,
        walletAddress: walletAddress || null
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
