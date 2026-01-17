import { useState, useEffect, useCallback } from 'react';
import socketService from '@/src/services/socket.service';
import { logger } from '@/src/utils/logger';
import { SOCKET_EVENTS } from '@/src/constants';

interface Message {
  id: string;
  content: string;
  messageType: 'user' | 'system';
  userId: string | null;
  user?: {
    id?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  createdAt: string;
}

interface Chatroom {
  id: string;
  name: string;
  date: string;
  stats?: {
    totalMessages: number;
    userMessages?: number;
    aiMessages?: number;
  };
}

interface UseChatReturn {
  messages: Message[];
  chatroom: Chatroom | null;
  isConnected: boolean;
  isTyping: boolean;
  streamingText: string;
  sendMessage: (content: string, username?: string) => void;
  connect: (serverUrl: string, options?: { query?: Record<string, any> }) => void;
  disconnect: () => void;
}

export const useChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatroom, setChatroom] = useState<Chatroom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const connect = useCallback((serverUrl: string, options?: { query?: Record<string, any> }) => {
    const socket = socketService.connect(serverUrl, options);

    // Debug: Listen to all events
    socket.onAny((eventName, ...args) => {
      logger.info(`📨 Socket event received: ${eventName}`, args);
    });

    // Connection events
    socket.on('connect', () => {
      logger.info('✅ Socket connected, waiting for chatroom join...');
      logger.info('Socket ID:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      logger.info('❌ Socket disconnected. Reason:', reason);
    });

    // Chatroom joined event - this is when we're truly ready
    socket.on(
      SOCKET_EVENTS.CHATROOM_JOINED,
      (data: {
        chatroom: Chatroom;
        messages: Message[];
        pagination: {
          hasMore: boolean;
          nextCursor: string | null;
          totalCount: number;
        };
      }) => {
        logger.info('✅ Joined chatroom:', data.chatroom.id);
        logger.info('Received messages:', data.messages.length);
        setChatroom(data.chatroom);
        setMessages(data.messages); // Keep original order from backend
        setIsConnected(true); // Set connected only after joining chatroom
      }
    );

    // New message received
    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, (message: Message) => {
      logger.info('Message received:', message.id);
      setMessages((prev) => [...prev, message]);
    });

    // AI typing indicator
    socket.on(SOCKET_EVENTS.AI_TYPING, (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    // AI streaming response
    socket.on(
      SOCKET_EVENTS.AI_STREAMING,
      (data: { chunk: string; isComplete: boolean }) => {
        if (data.isComplete) {
          setStreamingText('');
        } else {
          setStreamingText((prev) => prev + data.chunk);
        }
      }
    );

    // Error handling
    socket.on(SOCKET_EVENTS.ERROR, (error: { message: string }) => {
      logger.error('Socket error:', error.message);
      setIsConnected(false);
    });

    // Connection error handling
    socket.on('connect_error', (error) => {
      logger.error('Connection error:', error);
      setIsConnected(false);
    });

    socket.on('reconnect_error', (error) => {
      logger.error('Reconnection error:', error);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      logger.info(`Reconnected after ${attemptNumber} attempts`);
    });
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setMessages([]);
    setChatroom(null);
    setStreamingText('');
    setIsTyping(false);
  }, []);

  const sendMessage = useCallback((content: string, username?: string) => {
    const socket = socketService.getSocket();
    if (!socket || !content.trim()) return;

    logger.info('Sending message:', content);
    socket.emit(SOCKET_EVENTS.MESSAGE_SEND, {
      content: content.trim(),
      username,
    });
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    messages,
    chatroom,
    isConnected,
    isTyping,
    streamingText,
    sendMessage,
    connect,
    disconnect,
  };
};
