#!/bin/bash

echo "🚀 Switching from master to main branch..."

# Create main branch from current master
git checkout -b main

# Push main branch to remote
git push -u origin main

echo "✅ Created main branch from master"

# Now let's merge our security fixes
echo "🔧 Merging security fixes to main..."

# The main branch now has all our security fixes from master
echo "✅ Main branch is ready with all security fixes!"

echo "🎯 Next steps:"
echo "1. Go to Vercel dashboard"
echo "2. Update production domain to point to main branch"
echo "3. Delete master branch after confirming everything works"
