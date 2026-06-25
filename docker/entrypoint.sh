#!/bin/sh
set -e

echo "🚀 Starting deployment checks..."

# 1. Run migrations
echo "📅 Running database migrations..."
cd /app/packages/database
npx prisma migrate deploy

# 2. Check if Database is empty before running seed
echo "🔍 Checking if database needs seeding..."
# We run a lightweight query using node to count users.
# If count is 0, we run the seeder.
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(count => {
    console.log(count);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
")

if [ "$USER_COUNT" = "0" ]; then
  echo "🌱 Database is empty. Running database seed..."
  npx prisma db seed
else
  echo "ℹ️ Database already contains data ($USER_COUNT users). Skipping seed."
fi

# 3. Start the API application
echo "⚡ Starting API server..."
cd /app/apps/api
exec node dist/index.js
