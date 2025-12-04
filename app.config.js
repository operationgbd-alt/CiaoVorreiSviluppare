export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl: process.env.API_URL ?? 'https://solartech-backend-production.up.railway.app/api',
      eas: config.extra?.eas,
    },
  };
};
