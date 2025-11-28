#!/bin/bash
# Start backend server in background
npx tsx server/src/index.ts &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start Expo
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_DEV_DOMAIN REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN npx expo start

# Cleanup
kill $BACKEND_PID 2>/dev/null
