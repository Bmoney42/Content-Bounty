#!/bin/bash

echo "🧹 CLEANING UP MASTER BRANCH"
echo "============================="

echo "⚠️  WARNING: This will delete the master branch!"
echo "Make sure main branch is working correctly first."
echo ""

read -p "Are you sure you want to delete the master branch? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Deleting local master branch..."
    git branch -d master
    
    echo "🗑️  Deleting remote master branch..."
    git push origin --delete master
    
    echo "✅ Master branch deleted successfully!"
    echo ""
    echo "🎯 Your repository now uses main branch exclusively"
    echo "🔗 Production site: https://www.creatorbounty.xyz/"
else
    echo "❌ Operation cancelled"
fi
