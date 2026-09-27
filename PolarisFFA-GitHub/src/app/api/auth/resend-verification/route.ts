import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/utils'
import { sendVerificationEmail } from '@/lib/email'

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

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({ success: true, message: 'If the email exists, a verification link has been sent.' })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 })
    }

    const verificationToken = generateVerificationToken()

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: verificationToken },
    })

    await sendVerificationEmail(email, verificationToken, user.minecraftUsername)

    return NextResponse.json({ success: true, message: 'Verification email sent' })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}