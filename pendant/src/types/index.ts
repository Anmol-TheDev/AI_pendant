// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Chat Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Chatroom {
  id: string;
  name: string;
  description: string;
  date: string;
  isActive: boolean;
  stats: {
    totalMessages: number;
    lastMessageAt?: string;
    participantCount?: number;
  };
  lastMessage?: {
    id: string;
    content: string;
    messageType: string;
    createdAt: string;
  };
  // Legacy fields for backward compatibility
  title?: string;
  userId?: string;
  summary?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// History Types
export interface DailySummary {
  date: string;
  totalMessages: number;
  topics: string[];
  sentiment: string;
}

export interface WeeklySummary {
  week: string;
  totalMessages: number;
  topTopics: string[];
  averageSentiment: string;
}

// Search Types
export interface SearchResult {
  id: string;
  content: string;
  relevance: number;
  timestamp: Date;
  chatroomId: string;
}

// Socket Types
export interface SocketMessage {
  chatroomId: string;
  message: string;
  timestamp?: Date;
}

export interface SocketResponse {
  messageId: string;
  content: string;
  timestamp: Date;
}
