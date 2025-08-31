#!/bin/bash

echo "🎯 MIGRATING FROM MASTER TO MAIN BRANCH"
echo "========================================"

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "❌ Error: Must be on master branch to migrate"
    exit 1
fi

# Check if main branch already exists
if git show-ref --verify --quiet refs/heads/main; then
    echo "⚠️  Main branch already exists. Switching to it..."
    git checkout main
    echo "🔄 Merging master into main..."
    git merge master
else
    echo "🆕 Creating main branch from master..."
    git checkout -b main
fi

# Push main branch to remote
echo "📤 Pushing main branch to remote..."
git push -u origin main

echo ""
echo "✅ MIGRATION COMPLETE!"
echo "======================"
echo "🎯 Your main branch now contains:"
echo "   ✅ All security fixes from master"
echo "   ✅ Role switching functionality"
echo "   ✅ Input validation and sanitization"
echo "   ✅ Rate limiting"
echo "   ✅ Security headers"
echo "   ✅ Demo account prevention"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Go to Vercel dashboard"
echo "2. Update production domain (creatorbounty.xyz) to point to main branch"
echo "3. Test the production site"
echo "4. Delete master branch after confirming everything works"
echo ""
echo "🔗 Vercel Dashboard: https://vercel.com/dashboard"
