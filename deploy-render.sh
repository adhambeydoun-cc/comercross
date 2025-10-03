#!/bin/bash

echo "🚀 Deploying Dialpad Webhook to Render..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Please run this script from the project root."
  exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
  echo "📦 Initializing Git repository..."
  git init
  git add .
  git commit -m "Initial commit for Render deployment"
fi

# Check if we have a remote origin
if ! git remote get-url origin > /dev/null 2>&1; then
  echo "🔗 Please add your GitHub repository as origin:"
  echo "   git remote add origin https://github.com/yourusername/dialpad-webhook.git"
  echo "   git push -u origin main"
  echo ""
  echo "Then visit: https://render.com/dashboard"
  echo "Click 'New +' → 'Web Service'"
  echo "Connect your GitHub repository"
  echo "Use these settings:"
  echo "  - Build Command: npm install && npm run build"
  echo "  - Start Command: npm start"
  echo "  - Environment: Node"
  echo "  - Plan: Starter ($7/month)"
  echo ""
  echo "Set these environment variables:"
  echo "  - DIALPAD_WEBHOOK_SECRET: 190283950172"
  echo "  - BUILDERPRIME_API_KEY: CrylHk2.lQ8zZDbuDFtj94jniUpn"
  echo "  - BUILDERPRIME_BASE_URL: https://dialpad-testing.builderprime.com/api"
  echo ""
  echo "✅ Ready for Render deployment!"
else
  echo "✅ Git repository configured"
  echo "🔄 Pushing latest changes..."
  git add .
  git commit -m "Deploy to Render" || echo "No changes to commit"
  git push origin main
  echo ""
  echo "✅ Code pushed to GitHub!"
  echo "🔄 Render will automatically deploy your changes"
  echo ""
  echo "📊 Monitor deployment at: https://render.com/dashboard"
fi
