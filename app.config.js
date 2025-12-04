export default ({ config }) => {
  return {
    ...config,
    name: "SolarTech",
    slug: "solartech",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.solartech.app",
    },
    android: {
      package: "com.solartech.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    plugins: [
      ...(config.plugins || []),
      "expo-secure-store",
    ],
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL ?? 'https://solartech-backend-production.up.railway.app/api',
    },
  };
};