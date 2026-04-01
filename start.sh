#!/bin/sh
set -e

# Run Prisma migrations
cd /app/backend
npx prisma migrate deploy || echo "Migration warning (may be ok on first deploy)"

# Start backend on internal port 4000
PORT=4000 NODE_ENV=production node dist/main.js &
BACKEND_PID=$!

# Wait briefly for backend to start
sleep 2

# Start frontend on the PORT Render assigns (default 10000)
cd /app/frontend
NODE_ENV=production npx next start -p ${PORT:-10000} &
FRONTEND_PID=$!

# If either exits, shut down both
wait -n
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
exit 1
