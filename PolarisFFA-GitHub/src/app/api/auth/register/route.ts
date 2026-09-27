import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  minecraftUsername: z.string().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, minecraftUsername } = validation.data

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 400 }
      )
    }

    // Check if Minecraft username already exists
    const existingMc = await prisma.user.findUnique({
      where: { minecraftUsername: minecraftUsername.toLowerCase() },
    })

    if (existingMc) {
      return NextResponse.json(
        { error: 'This Minecraft username is already linked to another account.' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate verification token
    const verificationToken = generateVerificationToken()

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        minecraftUsername: minecraftUsername.toLowerCase(),
        emailVerificationToken: verificationToken,
        role: 'USER',
      },
    })

    // Send verification email
    await sendVerificationEmail(email, verificationToken, minecraftUsername)

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}