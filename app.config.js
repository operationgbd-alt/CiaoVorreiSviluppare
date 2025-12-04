export default ({ config }) => {
  return {
    ...config,
    name: "SolarTech",
    slug: "solartech",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0066CC"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.solartech.app",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "L'app ha bisogno della tua posizione per registrare dove vengono effettuati gli interventi.",
        NSLocationAlwaysAndWhenInUseUsageDescription: "L'app ha bisogno della tua posizione per registrare dove vengono effettuati gli interventi.",
        NSCameraUsageDescription: "L'app ha bisogno della fotocamera per scattare foto degli interventi.",
        NSPhotoLibraryUsageDescription: "L'app ha bisogno di accedere alle foto per caricare immagini degli interventi."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0066CC"
      },
      package: "com.solartech.app",
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "L'app ha bisogno della tua posizione per registrare dove vengono effettuati gli interventi."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "L'app ha bisogno della fotocamera per scattare foto degli interventi."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "L'app ha bisogno di accedere alle foto per caricare immagini degli interventi."
        }
      ]
    ],
    extra: {
      apiUrl: process.env.API_URL ?? 'https://solartech-backend-production.up.railway.app/api',
      eas: {
        projectId: "11a4e9f4-ba9a-4e5e-b204-15f741b46117"
      }
    }
  };
};