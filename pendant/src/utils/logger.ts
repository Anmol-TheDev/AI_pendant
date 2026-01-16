// Simple logger utility
export const logger = {
  info: (...args: any[]) => {
    if (__DEV__) {
      console.log('[INFO]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (__DEV__) {
      console.error('[ERROR]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (__DEV__) {
      console.warn('[WARN]', ...args);
    }
  },
};
