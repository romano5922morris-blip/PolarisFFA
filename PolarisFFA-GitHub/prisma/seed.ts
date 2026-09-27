import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create initial owner account
  const ownerEmail = process.env.INITIAL_OWNER_EMAIL || 'romano5922morris@gmail.com'
  const ownerPassword = process.env.INITIAL_OWNER_PASSWORD || 'ChangeMe123!'
  const ownerMinecraft = process.env.INITIAL_OWNER_MINECRAFT_USERNAME || 'PolarisOwner'

  const existingOwner = await prisma.user.findUnique({
    where: { email: ownerEmail.toLowerCase() },
  })

  if (!existingOwner) {
    const passwordHash = await bcrypt.hash(ownerPassword, 12)

    await prisma.user.create({
      data: {
        email: ownerEmail.toLowerCase(),
        passwordHash,
        minecraftUsername: ownerMinecraft.toLowerCase(),
        emailVerified: true,
        role: 'OWNER',
      },
    })

    console.log(`✅ Created owner account: ${ownerEmail}`)
  } else {
    console.log(`ℹ️ Owner account already exists: ${ownerEmail}`)
  }

  // Create sample products
  const sampleProducts = [
    {
      name: 'VIP',
      description: 'Entry-level supporter rank with basic perks',
      price: 999,
      type: 'rank',
      active: true,
      featured: false,
      sortOrder: 1,
      metadata: {
        benefits: [
          'VIP prefix in chat',
          'Access to /vip kit',
          'Colored chat messages',
          '1 home (/sethome)',
          'Priority queue access',
          'Discord VIP role',
        ],
        color: 'from-yellow-500 to-orange-500',
      },
    },
    {
      name: 'MVP',
      description: 'Enhanced rank with gameplay advantages',
      price: 1999,
      type: 'rank',
      active: true,
      featured: true,
      sortOrder: 2,
      metadata: {
        benefits: [
          'All VIP perks',
          'MVP prefix in chat',
          'Access to /mvp kit',
          '3 homes (/sethome)',
          '/fly in lobby',
          'Custom join messages',
          'Monthly crate key',
          'Discord MVP role',
        ],
        color: 'from-polaris-400 to-polaris-600',
      },
    },
    {
      name: 'ELITE',
      description: 'Premium rank with exclusive cosmetics',
      price: 3999,
      type: 'rank',
      active: true,
      featured: false,
      sortOrder: 3,
      metadata: {
        benefits: [
          'All MVP perks',
          'ELITE prefix in chat',
          'Access to /elite kit',
          'Unlimited homes',
          '/fly everywhere',
          'Particle trails',
          'Custom kill messages',
          'Weekly crate keys',
          'Discord ELITE role',
          'Exclusive cosmetics',
        ],
        color: 'from-purple-500 to-pink-500',
      },
    },
    {
      name: 'LEGEND',
      description: 'Ultimate supporter rank with all perks',
      price: 7999,
      type: 'rank',
      active: true,
      featured: false,
      sortOrder: 4,
      metadata: {
        benefits: [
          'All ELITE perks',
          'LEGEND prefix in chat',
          'Access to /legend kit',
          'Custom particle effects',
          'Exclusive LEGEND cosmetics',
          'Daily crate keys',
          'Discord LEGEND role',
          'Priority support',
        ],
        color: 'from-red-500 to-red-700',
      },
    },
    {
      name: 'POLARIS',
      description: 'The pinnacle rank - exclusive and limited',
      price: 14999,
      type: 'rank',
      active: true,
      featured: false,
      sortOrder: 5,
      metadata: {
        benefits: [
          'All LEGEND perks',
          'POLARIS prefix in chat (animated)',
          'Custom POLARIS kit',
          'Unique particle aura',
          'All cosmetics unlocked',
          'Hourly crate keys',
          'Discord POLARIS role',
          'Direct owner contact',
          'Custom features on request',
        ],
        color: 'from-polaris-400 via-purple-500 to-pink-500',
      },
    },
  ]

  for (const product of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    })

    if (!existing) {
      await prisma.product.create({ data: product })
      console.log(`✅ Created product: ${product.name}`)
    } else {
      console.log(`ℹ️ Product already exists: ${product.name}`)
    }
  }

  console.log('🌱 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })