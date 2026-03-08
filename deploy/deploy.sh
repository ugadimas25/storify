#!/bin/bash
# Deploy script for Storify on Tencent Cloud

set -e

echo "🚀 Starting Storify deployment..."

# Variables
APP_DIR="/var/www/storify"
BACKUP_DIR="/var/www/storify-backup-$(date +%Y%m%d_%H%M%S)"

# Backup current deployment
if [ -d "$APP_DIR" ]; then
    echo "📦 Backing up current deployment..."
    cp -r "$APP_DIR" "$BACKUP_DIR"
fi

cd "$APP_DIR"

# Pull latest code (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# Build application
echo "🔨 Building application..."
npm run build

# Push database migrations
echo "🗄️ Pushing database schema..."
npm run db:push

# Restart application
echo "🔄 Restarting application..."
systemctl restart storify

# Reload nginx
echo "🌐 Reloading nginx..."
systemctl reload nginx

# Health check
echo "❤️ Running health check..."
sleep 3
if curl -s http://localhost:5000/api/books > /dev/null; then
    echo "✅ Application is healthy!"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Visit: https://app.storify.asia"
