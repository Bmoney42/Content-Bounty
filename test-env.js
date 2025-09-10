// Test script to check environment variables
console.log('🔍 Checking Environment Variables...\n')

const requiredVars = {
  'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
  'FIREBASE_PROJECT_ID': process.env.FIREBASE_PROJECT_ID,
  'FIREBASE_CLIENT_EMAIL': process.env.FIREBASE_CLIENT_EMAIL,
  'FIREBASE_PRIVATE_KEY': process.env.FIREBASE_PRIVATE_KEY,
  'STRIPE_PLATFORM_ACCOUNT_ID': process.env.STRIPE_PLATFORM_ACCOUNT_ID
}

let allGood = true

Object.entries(requiredVars).forEach(([key, value]) => {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${key}: MISSING`)
    allGood = false
  }
})

console.log('\n' + '='.repeat(50))

if (allGood) {
  console.log('🎉 All required environment variables are set!')
} else {
  console.log('⚠️  Some environment variables are missing.')
  console.log('Please check your .env file and ensure all required variables are set.')
}

console.log('\n📝 Next steps:')
console.log('1. Copy the missing variables from env.example to your .env file')
console.log('2. Fill in your actual Stripe and Firebase credentials')
console.log('3. Restart your development server')
console.log('4. Try creating a bounty again')
