import { API_BASE_URL, SOCKET_URL } from '../constants';

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    timeout: 30000,
  },
  socket: {
    url: SOCKET_URL,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },
  app: {
    name: 'AI Pendant',
    version: '1.0.0',
  },
} as const;

export * from './theme';
