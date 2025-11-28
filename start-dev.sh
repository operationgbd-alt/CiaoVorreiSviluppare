#!/bin/bash
echo "Starting SolarTech - Backend + Frontend + Proxy..."
npx concurrently \
  --names "SERVER,EXPO,PROXY" \
  --prefix-colors "blue,green,yellow" \
  "SERVER_PORT=3001 npx tsx server/src/index.ts" \
  "EXPO_PACKAGER_PROXY_URL=https://\$REPLIT_DEV_DOMAIN REACT_NATIVE_PACKAGER_HOSTNAME=\$REPLIT_DEV_DOMAIN npx expo start --port 8082" \
  "node proxy-server.js"
