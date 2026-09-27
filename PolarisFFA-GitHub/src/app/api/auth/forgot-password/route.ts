import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/utils'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Don't reveal if email exists
    if (!user) {
      return NextResponse.json({ success: true, message: 'If the email exists, a reset link has been sent.' })
    }

    const resetToken = generateVerificationToken()
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    await sendPasswordResetEmail(email, resetToken, user.minecraftUsername)

    return NextResponse.json({ success: true, message: 'Password reset email sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}