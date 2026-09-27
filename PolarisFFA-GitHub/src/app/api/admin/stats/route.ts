import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getServerStatus } from '@/lib/server-status'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !['ADMIN', 'HEAD_ADMIN', 'CO_OWNER', 'OWNER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [totalUsers, totalOrders, completedOrders, serverStatus, openTickets] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { total: true },
      }),
      getServerStatus(),
      prisma.ticket.count({ where: { status: 'OPEN' } }),
    ])

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalRevenue: completedOrders._sum.total || 0,
      onlineStatus: serverStatus.online,
      currentPlayers: serverStatus.playersOnline,
      openTickets,
    })
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}