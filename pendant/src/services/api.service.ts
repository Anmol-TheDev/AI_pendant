import { Platform } from 'react-native';
import { toast } from '@/src/utils/toast';
import { API_BASE_URL, TIMEOUTS } from '@/src/constants';

// Use the API_BASE_URL from constants which handles environment variables
export const BACKEND_URL = API_BASE_URL;
const MICROSERVICE_URL = `http://${Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
})}:8001`;

// Types
export interface Message {
  id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
  timestamp: string;
  messageType?: 'user' | 'system' | 'transcription';
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
  userId?: string;
  summary?: string;
  messages?: Message[];
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedMessages {
  messages: Message[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    totalCount: number;
    currentCount: number;
  };
}

export interface ChatroomEnterResponse {
  chatroom: Chatroom;
  context: {
    hasContext: boolean;
    totalChunks: number;
    totalWords: number;
    timeRange?: {
      start: string;
      end: string;
    };
  };
  systemPrompt: string;
  aiResponse?: string;
}

export interface TranscriptChunk {
  text: string;
  timestamp: string;
  chunkNumber?: number;
}

export interface Summary {
  date: string;
  summary: string;
  highlights: string[];
  topTopics: string[];
  sentiment: string;
  wordCount: number;
}

export interface ContextItem {
  text: string;
  timestamp: string;
  relevance: number;
}

// API Functions

export const api = {
  // Chatroom APIs
  // ✅ Working: getTodayChatroom, getChatroomById, enterChatroom
  // ⚠️  Partial: getAllChatrooms (works without params, fails with pagination params - using client-side pagination)
  // ❌ Broken: getChatroomMessages, getPaginatedMessages (server errors)
  
  getTodayChatroom: async (): Promise<Chatroom | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/chatrooms/today`);
      if (!res.ok) throw new Error('Failed to fetch chatroom');
      const response = await res.json();
      return response.data;
    } catch (e) {
      console.error('Error fetching today chatroom', e);
      toast.error("Failed to load today's chat");
      return null;
    }
  },

  getChatroomById: async (chatroomId: string): Promise<Chatroom | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/chatrooms/${chatroomId}`);
      if (!res.ok) throw new Error('Failed to fetch chatroom');
      const response = await res.json();
      return response.data;
    } catch (e) {
      console.error('Error fetching chatroom', e);
      toast.error("Failed to load chatroom");
      return null;
    }
  },

  getAllChatrooms: async (page: number = 1, limit: number = 20): Promise<{ chatrooms: Chatroom[]; pagination: any } | null> => {
    try {
      // Note: Endpoint works WITHOUT query params, but FAILS with pagination params
      // This is a backend bug - using workaround
      const res = await fetch(`${BACKEND_URL}/chatrooms`);
      if (!res.ok) throw new Error('Failed to fetch chatrooms');
      const response = await res.json();
      
      if (!response.data?.chatrooms) {
        return { chatrooms: [], pagination: { page: 1, limit, total: 0, hasMore: false } };
      }
      
      // Manual pagination on client side
      const allChatrooms = response.data.chatrooms;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedChatrooms = allChatrooms.slice(startIndex, endIndex);
      
      return {
        chatrooms: paginatedChatrooms,
        pagination: {
          page,
          limit,
          total: allChatrooms.length,
          hasMore: endIndex < allChatrooms.length,
        },
      };
    } catch (e) {
      console.error('Error fetching chatrooms', e);
      toast.error("Failed to load chatrooms");
      return null;
    }
  },

  getChatroomMessages: async (chatroomId: string, limit: number = 50): Promise<Message[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/chatrooms/${chatroomId}/messages?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const response = await res.json();
      
      // Map backend message format to frontend format
      return (response.data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.createdAt,
        messageType: msg.messageType,
      }));
    } catch (e) {
      console.error('Error fetching messages', e);
      toast.error("Failed to load messages");
      return [];
    }
  },

  getPaginatedMessages: async (
    chatroomId: string,
    limit: number = 50,
    cursor?: string
  ): Promise<PaginatedMessages | null> => {
    try {
      let url = `${BACKEND_URL}/chatrooms/${chatroomId}/messages/paginated?limit=${limit}`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const response = await res.json();
      
      // Map backend message format to frontend format
      const messages = (response.data?.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.createdAt,
        messageType: msg.messageType,
      }));
      
      return {
        messages,
        pagination: response.data?.pagination || {
          hasMore: false,
          nextCursor: null,
          totalCount: 0,
          currentCount: 0,
        },
      };
    } catch (e) {
      console.error('Error fetching paginated messages', e);
      toast.error("Failed to load messages");
      return null;
    }
  },

  enterChatroom: async (
    chatroomId: string,
    userId?: string,
    message?: string
  ): Promise<ChatroomEnterResponse | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/chatrooms/${chatroomId}/enter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message }),
      });
      
      if (!res.ok) throw new Error('Failed to enter chatroom');
      const response = await res.json();
      return response.data;
    } catch (e) {
      console.error('Error entering chatroom', e);
      toast.error("Failed to enter chatroom");
      return null;
    }
  },

  // Transcripts & Context - No userId needed (backend uses default)
  ingestTranscript: async (text: string, timestamp: string = new Date().toISOString(), chunkNumber?: number): Promise<void> => {
    try {
        const res = await fetch(`${BACKEND_URL}/transcripts/ingest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                timestamp,
                chunkNumber,
            }),
        });
        if (!res.ok) throw new Error('Failed to save transcript');
    } catch (e) {
        console.error('Error ingesting', e);
        toast.error("Failed to save your message");
    }
  },

  getDailySummary: async (date: string): Promise<Summary | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/transcripts/summary/daily?date=${date}`);
      if (!res.ok) return null;
      const response = await res.json();
      return response.data;
    } catch (e) {
      console.error('Error fetching daily summary', e);
      return null;
    }
  },

  getHourlyContext: async (date: string, hour: number): Promise<ContextItem[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/transcripts/context/hour?date=${date}&hour=${hour}`);
      if (!res.ok) return [];
      const response = await res.json();
      const data = response.data;
      
      // Map chunks to ContextItem format
      return (data?.chunks || []).map((chunk: any) => ({
        text: chunk.text,
        timestamp: chunk.startTimestamp,
        relevance: 1.0, // No relevance score for hourly context
      }));
    } catch (e) {
      console.error('Error fetching hourly context', e);
      return [];
    }
  },

  getUserChatrooms: async (limit: number = 30): Promise<Chatroom[]> => {
    try {
      // Note: The endpoint without query params works, but with pagination params it fails
      const res = await fetch(`${BACKEND_URL}/chatrooms`);
      
      if (!res.ok) {
        console.warn('Chatrooms endpoint returned error');
        return [];
      }
      
      const response = await res.json();
      
      if (!response.success || !response.data?.chatrooms) {
        return [];
      }
      
      // Limit on client side since backend pagination is broken
      const chatrooms = response.data.chatrooms || [];
      return chatrooms.slice(0, limit);
    } catch (e) {
      console.error('Error fetching chatrooms', e);
      return [];
    }
  },

  semanticSearch: async (query: string, date?: string, limit: number = 10): Promise<ContextItem[]> => {
    try {
      let url = `${BACKEND_URL}/transcripts/context/search?query=${encodeURIComponent(query)}&limit=${limit}`;
      if (date) {
        url += `&date=${date}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Search failed");
      const response = await res.json();
      
      // Backend returns { success, message, data: { query, chunks: [...] } }
      const chunks = response.data?.chunks || [];
      
      if (chunks.length === 0) {
        toast.show("No matching memories found");
      }
      
      return chunks.map((chunk: any) => ({
        text: chunk.text,
        timestamp: chunk.date, // Use date as timestamp
        relevance: chunk.score,
      }));
    } catch (e) {
      console.error('Error searching transcripts', e);
      toast.error("Search failed. Please try again.");
      return [];
    }
  },

  getWeeklySummary: async (endDate: string): Promise<any | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/transcripts/summary/weekly?endDate=${endDate}`);
      if (!res.ok) return null;
      const response = await res.json();
      return response.data;
    } catch (e) {
        console.error('Error fetching weekly summary', e);
        return null;
    }
  },

  findSimilarEvents: async (chunkId: string, limit: number = 10): Promise<any[]> => {
    try {
        const res = await fetch(`${BACKEND_URL}/transcripts/context/similar?chunkId=${chunkId}&limit=${limit}`);
        if (!res.ok) return [];
        const response = await res.json();
        
        // Backend returns { success, message, data: { sourceChunk, chunks: [...] } }
        return response.data?.chunks || [];
    } catch (e) {
        console.error('Error finding similar events', e);
        return [];
    }
  },

  // Microservice (Audio)
  uploadAudioChunk: async (uri: string, chunkNumber: number, time: string) => {
    try {
        const formData = new FormData();
        formData.append('audio_file', {
            uri,
            name: `chunk_${chunkNumber}.wav`,
            type: 'audio/wav',
        } as any);
        formData.append('chunk_number', String(chunkNumber));
        formData.append('time', time);

        const res = await fetch(`${MICROSERVICE_URL}/transcribe-chunk`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        
        if (!res.ok) throw new Error('Failed to upload audio chunk');
        return await res.json();
    } catch (e) {
        console.error("Audio upload failed", e);
        toast.error("Failed to upload audio");
        throw e;
    }
  }
};
