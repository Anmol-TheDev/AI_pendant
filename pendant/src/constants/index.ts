// API Constants
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:4000';
export const API_BASE_URL = `${BACKEND_URL}/api`;
export const SOCKET_URL = BACKEND_URL; // Socket.IO is at root path

// Socket Events
export const SOCKET_EVENTS = {
  // Client → Server
  MESSAGE_SEND: 'message:send',
  
  // Server → Client
  CHATROOM_JOINED: 'chatroom:joined',
  MESSAGE_RECEIVED: 'message:received',
  AI_TYPING: 'ai:typing',
  AI_STREAMING: 'ai:streaming',
  ERROR: 'error',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Chatrooms
  CHATROOMS: '/chatrooms',
  CHATROOM_BY_ID: (id: string) => `/chatrooms/${id}`,
  CHATROOM_MESSAGES: (id: string) => `/chatrooms/${id}/messages`,
  
  // History
  DAILY_SUMMARY: '/history/daily',
  WEEKLY_SUMMARY: '/history/weekly',
  
  // Search
  SEARCH: '/search',
} as const;

// App Constants
export const APP_NAME = 'AI Pendant';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  THEME: 'theme',
} as const;

// Timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 seconds
  SOCKET_RECONNECT: 1000, // 1 second
  SOCKET_MAX_RETRIES: 5,
} as const;
