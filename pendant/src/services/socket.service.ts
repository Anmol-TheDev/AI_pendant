import { io, Socket } from 'socket.io-client';
import { logger } from '@/src/utils/logger';
import { TIMEOUTS } from '@/src/constants';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string = '';

  connect(serverUrl: string): Socket {
    this.serverUrl = serverUrl;
    
    logger.info('🔌 Attempting to connect to:', serverUrl);
    
    this.socket = io(serverUrl, {
      transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
      reconnection: true,
      reconnectionDelay: TIMEOUTS.SOCKET_RECONNECT,
      reconnectionAttempts: TIMEOUTS.SOCKET_MAX_RETRIES,
      timeout: 20000, // 20 second connection timeout
      forceNew: true, // Force new connection
      autoConnect: true, // Auto connect on creation
      upgrade: true, // Allow transport upgrade
      rememberUpgrade: true, // Remember successful upgrade
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('✅ Connected to chat server');
      logger.info('Transport:', this.socket?.io.engine.transport.name);
    });

    this.socket.on('disconnect', (reason) => {
      logger.info('❌ Disconnected from chat server. Reason:', reason);
    });

    this.socket.on('connect_error', (error) => {
      logger.error('Connection error:', error.message || error);
      // Socket.IO errors may have additional properties
      const socketError = error as Error & { type?: string; description?: string };
      if (socketError.type || socketError.description) {
        logger.error('Error details:', {
          type: socketError.type,
          description: socketError.description,
        });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      logger.info(`✅ Reconnected after ${attemptNumber} attempts`);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      logger.info(`🔄 Reconnection attempt ${attemptNumber}...`);
    });

    this.socket.on('reconnect_error', (error) => {
      logger.error('Reconnection failed:', error.message || error);
    });

    this.socket.on('reconnect_failed', () => {
      logger.error('❌ All reconnection attempts failed');
    });

    // Log transport upgrade
    this.socket.io.engine.on('upgrade', (transport) => {
      logger.info('🚀 Transport upgraded to:', transport.name);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
