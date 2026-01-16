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
}

export interface Chatroom {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  summary?: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
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
  // Chatroom - No userId needed (backend uses default)
  getTodayChatroom: async (): Promise<Chatroom | null> => {
    try {
      const res = await fetch(`${BACKEND_URL}/chatrooms/today`);
      if (!res.ok) throw new Error('Failed to fetch chatroom');
      const response = await res.json();
      
      // Backend returns { success, message, data: { id, name, date, ... } }
      const data = response.data;
      return {
        id: data.id,
        date: data.date,
        userId: '', // Not used in backend
        summary: '',
        messages: [],
        created_at: data.date,
        updated_at: data.date,
      };
    } catch (e) {
      console.error('Error fetching today chatroom', e);
      toast.error("Failed to load today's chat");
      return null;
    }
  },

  getChatroomMessages: async (id: string, limit: number = 50): Promise<Message[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/chatrooms/${id}/messages/paginated?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const response = await res.json();
      
      // Backend returns { success, message, data: { messages: [...], pagination: {...} } }
      const messages = response.data?.messages || [];
      
      // Map backend message format to frontend format
      return messages.map((msg: any) => ({
        id: msg.id,
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.createdAt,
      }));
    } catch (e) {
      console.error('Error fetching messages', e);
      toast.error("Failed to load messages");
      return [];
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
      // Fetch all chatrooms (backend handles pagination internally)
      const res = await fetch(`${BACKEND_URL}/chatrooms`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const response = await res.json();
      
      // Backend returns { success, message, data: { chatrooms: [...], pagination: {...} } }
      const chatrooms = response.data?.chatrooms || [];
      
      // Limit on client side if needed
      return chatrooms.slice(0, limit).map((item: any) => ({
        id: item.id,
        date: item.date,
        userId: item.userId || '',
        summary: '', // Summary not included in chatroom list
        messages: [],
        created_at: item.createdAt || item.date || new Date().toISOString(),
        updated_at: item.updatedAt || item.date || new Date().toISOString(),
      }));
    } catch (e) {
      console.error('Error fetching chatrooms', e);
      toast.error("Failed to load history");
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
