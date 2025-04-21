#!/bin/bash

echo "🔴 Stopping all Next.js processes..."
pkill -f "node.*next" || true

echo "🧹 Removing Next.js cache..."
rm -rf .next/cache

echo "🟢 Starting Next.js dev server..."
npm run dev 