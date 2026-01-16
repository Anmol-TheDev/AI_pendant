import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  logLevel: process.env.LOG_LEVEL || 'info',

  mongo: {
    uri: process.env.MONGODB_URL || 'mongodb://localhost:27017/test',
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000'],
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },

  chroma: {
    url: process.env.CHROMA_URL || 'http://localhost:8000',
    collection: process.env.CHROMA_COLLECTION || 'audio_chunks',
  },
};

// Freeze the config object to make it immutable
export const appConfig = Object.freeze(config);

// Validate required environment variables
if (!appConfig.mongo.uri || appConfig.mongo.uri === 'mongodb://localhost:27017/test') {
  console.warn(
    'WARNING: MONGODB_URL is not set. Using default local MongoDB connection.'
  );
}

// Validate Gemini API key
if (!appConfig.gemini.apiKey) {
  console.warn(
    'WARNING: GEMINI_API_KEY is not set. AI chat features will not work.'
  );
}

// Re-export other config modules for convenience
export { default as dbInstance } from './db';
