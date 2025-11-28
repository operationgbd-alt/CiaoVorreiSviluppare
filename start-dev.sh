#!/bin/bash
echo "Starting SolarTech - Backend + Frontend..."
npx concurrently \
  --names "SERVER,EXPO" \
  --prefix-colors "blue,green" \
  "npx tsx server/src/index.ts" \
  "EXPO_PACKAGER_PROXY_URL=https://\$REPLIT_DEV_DOMAIN REACT_NATIVE_PACKAGER_HOSTNAME=\$REPLIT_DEV_DOMAIN npx expo start"
