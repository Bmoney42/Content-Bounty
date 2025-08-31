import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { InputValidator } from "@/lib/validation"
import { rateLimitSignup } from "@/lib/rate-limit"
import { UserRole } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitSignup(req)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const { name, email, password, role } = await req.json()

    // Validate and sanitize inputs
    const nameValidation = InputValidator.validateName(name)
    if (!nameValidation.isValid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      )
    }

    const emailValidation = InputValidator.validateEmail(email)
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      )
    }

    const passwordValidation = InputValidator.validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      )
    }

    const roleValidation = InputValidator.validateRole(role || "CREATOR")
    if (!roleValidation.isValid) {
      return NextResponse.json(
        { error: roleValidation.error },
        { status: 400 }
      )
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: emailValidation.sanitizedValue! }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordValidation.sanitizedValue!, 12)

    // Create user with sanitized data
    const user = await prisma.user.create({
      data: {
        name: nameValidation.sanitizedValue!,
        email: emailValidation.sanitizedValue!,
        password: hashedPassword,
        role: roleValidation.sanitizedValue! as UserRole
      }
    })

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}