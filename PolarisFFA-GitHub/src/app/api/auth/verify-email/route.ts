import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    })

    return NextResponse.json({ success: true, message: 'Email verified successfully' })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}