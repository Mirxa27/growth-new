#!/bin/bash

echo "🚀 Universal Deployment Script"
echo "=============================="
echo ""
echo "Choose your deployment platform:"
echo "1) Vercel"
echo "2) Netlify"
echo "3) Surge.sh (Instant, no account needed)"
echo "4) GitHub Pages"
echo "5) Firebase Hosting"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "📦 Deploying to Vercel..."
        if ! command -v vercel &> /dev/null; then
            npm i -g vercel
        fi
        vercel --prod
        ;;
    2)
        echo "📦 Deploying to Netlify..."
        if ! command -v netlify &> /dev/null; then
            npm i -g netlify-cli
        fi
        netlify deploy --prod --dir=dist
        ;;
    3)
        echo "📦 Deploying to Surge.sh..."
        if ! command -v surge &> /dev/null; then
            npm i -g surge
        fi
        surge dist newomen-app.surge.sh
        ;;
    4)
        echo "📦 Setting up GitHub Pages..."
        git add dist -f
        git commit -m "Deploy to GitHub Pages"
        git subtree push --prefix dist origin gh-pages
        echo "✅ Deployed to GitHub Pages!"
        echo "Enable GitHub Pages in your repo settings"
        ;;
    5)
        echo "📦 Deploying to Firebase..."
        if ! command -v firebase &> /dev/null; then
            npm i -g firebase-tools
        fi
        firebase init hosting
        firebase deploy
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac