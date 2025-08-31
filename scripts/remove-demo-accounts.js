const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeDemoAccounts() {
  try {
    console.log('🔍 Searching for demo accounts...')
    
    // Find and remove demo accounts
    const demoAccounts = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'creator@demo.com' },
          { email: 'business@demo.com' },
          { email: { contains: 'demo' } },
          { name: { contains: 'demo' } }
        ]
      }
    })

    if (demoAccounts.length > 0) {
      console.log(`🚨 Found ${demoAccounts.length} demo accounts to remove:`)
      demoAccounts.forEach(account => {
        console.log(`   - ${account.email} (${account.name})`)
      })

      // Delete demo accounts
      const deleteResult = await prisma.user.deleteMany({
        where: {
          OR: [
            { email: 'creator@demo.com' },
            { email: 'business@demo.com' },
            { email: { contains: 'demo' } },
            { name: { contains: 'demo' } }
          ]
        }
      })

      console.log(`✅ Successfully removed ${deleteResult.count} demo accounts`)
    } else {
      console.log('✅ No demo accounts found in the database')
    }

    // Also remove any bounties or data associated with demo accounts
    const demoBounties = await prisma.bounty.findMany({
      where: {
        business: {
          OR: [
            { email: 'creator@demo.com' },
            { email: 'business@demo.com' },
            { email: { contains: 'demo' } }
          ]
        }
      }
    })

    if (demoBounties.length > 0) {
      console.log(`🚨 Found ${demoBounties.length} demo bounties to remove`)
      
      const deleteBountiesResult = await prisma.bounty.deleteMany({
        where: {
          business: {
            OR: [
              { email: 'creator@demo.com' },
              { email: 'business@demo.com' },
              { email: { contains: 'demo' } }
            ]
          }
        }
      })

      console.log(`✅ Successfully removed ${deleteBountiesResult.count} demo bounties`)
    }

  } catch (error) {
    console.error('❌ Error removing demo accounts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

removeDemoAccounts()
