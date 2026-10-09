// Single place where environment variables are read. No secret defaults.
require('dotenv').config();

const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  usdaApiKey: process.env.USDA_API_KEY || '',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',').map((s) => s.trim()).filter(Boolean),
};

module.exports = config;
