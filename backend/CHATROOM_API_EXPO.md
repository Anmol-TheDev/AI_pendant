# Complete API Documentation for Expo App

Base URL: `http://localhost:4000` (Development)

## 📋 Table of Contents

### 🗨️ Chatroom APIs
1. [Get Today's Chatroom](#1-get-todays-chatroom)
2. [Get Chatroom By ID](#2-get-chatroom-by-id)
3. [Get All Chatrooms](#3-get-all-chatrooms)
4. [Get Chatroom Messages (Simple)](#4-get-chatroom-messages-simple)
5. [Get Paginated Messages](#5-get-paginated-messages-infinite-scroll)
6. [Enter Chatroom with Context](#6-enter-chatroom-with-context)

### 📝 Transcript APIs
7. [Ingest Transcript](#7-ingest-transcript)
8. [Get Daily Context](#8-get-daily-context)
9. [Get Hourly Context](#9-get-hourly-context)
10. [Semantic Search](#10-semantic-search)
11. [Find Similar Events](#11-find-similar-events)
12. [Get Daily Summary](#12-get-daily-summary)
13. [Get Weekly Summary](#13-get-weekly-summary)
14. [Get User Chatrooms](#14-get-user-chatrooms)

---

## 1. Get Today's Chatroom

**Endpoint:** `GET /api/chatrooms/today`

**Description:** Retrieves or creates the chatroom for the current day.

### Request Example (Expo)

```typescript
const getTodayChatroom = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/chatrooms/today', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data.data; // Returns chatroom object
  } catch (error) {
    console.error('Error fetching today chatroom:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Successfully fetched Chatroom.",
  data: {
    id: "679c1234567890abcdef1234",
    name: "Daily Chat - 2026-01-17",
    description: "Chatroom for 2026-01-17",
    date: "2026-01-17T00:00:00.000Z",
    isActive: true,
    stats: {
      totalMessages: 42,
      lastMessageAt: "2026-01-17T15:30:45.123Z",
      participantCount: 5
    }
  }
}
```

---

## 2. Get Chatroom By ID

**Endpoint:** `GET /api/chatrooms/:chatroomId`

**Description:** Retrieves a specific chatroom by its ID.

### Request Example (Expo)

```typescript
const getChatroomById = async (chatroomId: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/chatrooms/${chatroomId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching chatroom:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Successfully fetched Chatroom.",
  data: {
    id: "679c1234567890abcdef1234",
    name: "Daily Chat - 2026-01-17",
    description: "Chatroom for 2026-01-17",
    date: "2026-01-17T00:00:00.000Z",
    isActive: true,
    stats: {
      totalMessages: 42,
      lastMessageAt: "2026-01-17T15:30:45.123Z",
      participantCount: 5
    }
  }
}
```

---

## 3. Get All Chatrooms

**Endpoint:** `GET /api/chatrooms?page=1&limit=20`

**Description:** Retrieves all active chatrooms with pagination.

### Query Parameters

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

### Request Example (Expo)

```typescript
const getAllChatrooms = async (page = 1, limit = 20) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/chatrooms?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching chatrooms:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Successfully fetched Chatrooms.",
  data: {
    chatrooms: [
      {
        id: "679c1234567890abcdef1234",
        name: "Daily Chat - 2026-01-17",
        description: "Chatroom for 2026-01-17",
        date: "2026-01-17T00:00:00.000Z",
        isActive: true,
        stats: {
          totalMessages: 42,
          lastMessageAt: "2026-01-17T15:30:45.123Z",
          participantCount: 5
        },
        lastMessage: {
          id: "679c5678901234abcdef5679",
          content: "That's a great question!",
          messageType: "system",
          createdAt: "2026-01-17T15:30:45.123Z"
        }
      }
    ],
    pagination: {
      page: 1,
      limit: 20,
      total: 45,
      hasMore: true
    }
  }
}
```

---

## 4. Get Chatroom Messages (Simple)

**Endpoint:** `GET /api/chatrooms/:chatroomId/messages?limit=50`

**Description:** Retrieves the most recent messages from a chatroom (simple, no pagination).

### Query Parameters

- `limit` (optional): Maximum messages to retrieve (default: 50, max: 100)

### Request Example (Expo)

```typescript
const getChatroomMessages = async (chatroomId: string, limit = 50) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/chatrooms/${chatroomId}/messages?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data; // Returns array of messages
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Successfully fetched Messages.",
  data: [
    {
      id: "679c5678901234abcdef5678",
      content: "Hello, AI! How are you?",
      messageType: "user",
      createdAt: "2026-01-17T15:30:45.123Z"
    },
    {
      id: "679c5678901234abcdef5679",
      content: "Hello! I'm doing great!",
      messageType: "system",
      createdAt: "2026-01-17T15:30:48.456Z"
    }
  ]
}
```

---

## 5. Get Paginated Messages (Infinite Scroll)

**Endpoint:** `GET /api/chatrooms/:chatroomId/messages/paginated?limit=50&cursor=`

**Description:** Retrieves messages with cursor-based pagination (perfect for infinite scroll).

### Query Parameters

- `limit` (optional): Messages per page (default: 50, max: 100)
- `cursor` (optional): Message ID to paginate from (omit for first page)

### Request Example (Expo)

```typescript
const getPaginatedMessages = async (
  chatroomId: string,
  limit = 50,
  cursor?: string
) => {
  try {
    const url = cursor
      ? `http://localhost:4000/api/chatrooms/${chatroomId}/messages/paginated?limit=${limit}&cursor=${cursor}`
      : `http://localhost:4000/api/chatrooms/${chatroomId}/messages/paginated?limit=${limit}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching paginated messages:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Successfully fetched Messages.",
  data: {
    messages: [
      {
        id: "679c5678901234abcdef5678",
        content: "Hello, AI!",
        messageType: "user",
        createdAt: "2026-01-17T15:30:45.123Z"
      }
    ],
    pagination: {
      hasMore: true,
      nextCursor: "679c5678901234abcdef5670",
      totalCount: 250,
      currentCount: 50
    }
  }
}
```

### Infinite Scroll Implementation (Expo)

```typescript
import { useState, useEffect } from 'react';
import { FlatList } from 'react-native';

const ChatScreen = ({ chatroomId }) => {
  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMessages = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const data = await getPaginatedMessages(chatroomId, 50, cursor);
      
      // Prepend older messages
      setMessages(prev => [...data.messages, ...prev]);
      setCursor(data.pagination.nextCursor);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(); // Initial load
  }, []);

  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => <MessageItem message={item} />}
      keyExtractor={(item) => item.id}
      onEndReached={loadMessages}
      onEndReachedThreshold={0.5}
      inverted // For chat-style scrolling
    />
  );
};
```

---

## 6. Enter Chatroom with Context

**Endpoint:** `POST /api/chatrooms/:chatroomId/enter`

**Description:** Enter a chatroom with transcript context and optionally send a first message.

### Request Body

```typescript
{
  userId?: string;      // Optional: MongoDB ObjectId for transcript context
  message?: string;     // Optional: First message to send
}
```

### Request Example (Expo)

```typescript
const enterChatroom = async (
  chatroomId: string,
  userId?: string,
  message?: string
) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/chatrooms/${chatroomId}/enter`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message,
        }),
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error entering chatroom:', error);
    throw error;
  }
};

// Usage examples:
// 1. Enter with context and message
await enterChatroom(
  '679c1234567890abcdef1234',
  '507f1f77bcf86cd799439011',
  'What did I talk about today?'
);

// 2. Enter without message (just load context)
await enterChatroom(
  '679c1234567890abcdef1234',
  '507f1f77bcf86cd799439011'
);

// 3. Enter without context
await enterChatroom('679c1234567890abcdef1234');
```

### Response (With Context and Message)

```typescript
{
  success: true,
  message: "Successfully fetched Chatroom.",
  data: {
    chatroom: {
      id: "679c1234567890abcdef1234",
      name: "Daily Chat - 2026-01-17",
      description: "Chatroom for 2026-01-17",
      date: "2026-01-17T00:00:00.000Z",
      isActive: true,
      stats: {
        totalMessages: 15,
        lastMessageAt: "2026-01-17T14:30:00.000Z"
      }
    },
    context: {
      hasContext: true,
      totalChunks: 45,
      totalWords: 3250,
      timeRange: {
        start: "2026-01-17T00:00:00.000Z",
        end: "2026-01-18T00:00:00.000Z"
      }
    },
    systemPrompt: "Context-aware mode: AI will answer based on transcript context only",
    aiResponse: "Based on your transcript today, you discussed..."
  }
}
```

---

## 7. Ingest Transcript

**Endpoint:** `POST /api/transcripts/ingest`

**Description:** Ingests a transcript chunk from external transcription service. Automatically creates and manages chatrooms based on timestamps.

### Request Body

```typescript
{
  text: string;           // Required: Transcript text (1-5000 chars)
  timestamp: string;      // Required: ISO 8601 timestamp
  chunkNumber?: number;   // Optional: Sequential chunk number
}
```

### Request Example (Expo)

```typescript
const ingestTranscript = async (
  text: string,
  timestamp: string,
  chunkNumber?: number
) => {
  try {
    const response = await fetch(
      'http://localhost:4000/api/transcripts/ingest',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          timestamp,
          chunkNumber,
        }),
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error ingesting transcript:', error);
    throw error;
  }
};

// Usage examples:
await ingestTranscript(
  "Started gym again after months. Weighed 72.9kg in the morning.",
  "2026-01-14T08:15:00.000Z",
  1
);
```

### Response

```typescript
{
  success: true,
  message: "Transcript chunk ingested successfully",
  data: {
    chunkId: "679f1f77bcf86cd799439012",
    chatroomId: "679f1f77bcf86cd799439013",
    segmentId: "679f1f77bcf86cd799439014",
    embeddingId: "679f1f77bcf86cd799439012",
    chunkNumber: 1
  }
}
```

### Key Features

- **Automatic Chatroom Management**: Creates 24-hour chatrooms automatically
- **NLP Analysis**: Extracts sentiment and topics
- **Vector Embeddings**: Generates embeddings for semantic search
- **Sequential Naming**: "Day 1", "Day 2", etc.

---

## 8. Get Daily Context

**Endpoint:** `GET /api/transcripts/context/daily?date=2026-01-14`

**Description:** Retrieves structured transcript context for an entire day, organized by hour segments.

### Query Parameters

- `date` (required): Date in YYYY-MM-DD format

### Request Example (Expo)

```typescript
const getDailyContext = async (date: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/transcripts/context/daily?date=${date}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching daily context:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Daily context retrieved",
  data: {
    date: "2026-01-14",
    segments: [
      {
        hour: 8,
        chunks: [
          {
            text: "I went to the gym...",
            timestamp: "2026-01-14T08:15:00.000Z",
            chunkNumber: 1,
            sentiment: "positive",
            topics: ["gym", "workout", "morning"]
          }
        ],
        stats: {
          wordCount: 150,
          sentiment: {
            positive: 3,
            neutral: 1,
            negative: 0
          }
        }
      }
    ],
    totalChunks: 45,
    totalWords: 2340
  }
}
```

---

## 9. Get Hourly Context

**Endpoint:** `GET /api/transcripts/context/hour?date=2026-01-14&hour=14`

**Description:** Retrieves transcript chunks for a specific hour of a specific day.

### Query Parameters

- `date` (required): Date in YYYY-MM-DD format
- `hour` (required): Hour (0-23)

### Request Example (Expo)

```typescript
const getHourlyContext = async (date: string, hour: number) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/transcripts/context/hour?date=${date}&hour=${hour}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching hourly context:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Hourly context retrieved",
  data: {
    date: "2026-01-14",
    hour: 14,
    chunks: [
      {
        id: "679f1f77bcf86cd799439012",
        text: "Had lunch with the team...",
        timestamp: "2026-01-14T14:05:00.000Z",
        chunkNumber: 5,
        sentiment: "positive",
        topics: ["lunch", "team", "meeting"]
      }
    ],
    stats: {
      wordCount: 320,
      sentiment: {
        positive: 5,
        neutral: 2,
        negative: 1
      }
    }
  }
}
```

---

## 10. Semantic Search

**Endpoint:** `GET /api/transcripts/context/search?query=gym workout&date=2026-01-14&limit=10`

**Description:** Performs semantic similarity search across transcript chunks using vector embeddings.

### Query Parameters

- `query` (required): Search query text
- `date` (optional): Filter by specific date (YYYY-MM-DD)
- `limit` (optional): Max results (1-100, default: 10)

### Request Example (Expo)

```typescript
const semanticSearch = async (
  query: string,
  date?: string,
  limit = 10
) => {
  try {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });
    
    if (date) {
      params.append('date', date);
    }
    
    const response = await fetch(
      `http://localhost:4000/api/transcripts/context/search?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error performing semantic search:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Semantic search completed",
  data: {
    query: "gym workout",
    chunks: [
      {
        id: "679f1f77bcf86cd799439012",
        text: "I went to the gym this morning...",
        score: 0.92,
        timestamp: "2026-01-14T08:15:00.000Z",
        chunkNumber: 1,
        sentiment: "positive",
        topics: ["gym", "workout", "morning"]
      }
    ]
  }
}
```

---

## 11. Find Similar Events

**Endpoint:** `GET /api/transcripts/context/similar?chunkId=679f1f77bcf86cd799439012&limit=10`

**Description:** Finds transcript chunks that are semantically similar to a given chunk.

### Query Parameters

- `chunkId` (required): MongoDB ObjectId of the source chunk
- `limit` (optional): Max results (1-50, default: 10)

### Request Example (Expo)

```typescript
const findSimilarEvents = async (chunkId: string, limit = 10) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/transcripts/context/similar?chunkId=${chunkId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error finding similar events:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Similar events found",
  data: {
    sourceChunk: {
      id: "679f1f77bcf86cd799439012",
      text: "I went to the gym this morning...",
      timestamp: "2026-01-14T08:15:00.000Z"
    },
    chunks: [
      {
        id: "679f1f77bcf86cd799439013",
        text: "Great workout session at the gym...",
        score: 0.89,
        timestamp: "2026-01-13T07:30:00.000Z",
        chunkNumber: 3
      }
    ]
  }
}
```

---

## 12. Get Daily Summary

**Endpoint:** `GET /api/transcripts/summary/daily?date=2026-01-14`

**Description:** Generates an AI-powered summary of a day's transcripts using LLM.

### Query Parameters

- `date` (required): Date in YYYY-MM-DD format

### Request Example (Expo)

```typescript
const getDailySummary = async (date: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/transcripts/summary/daily?date=${date}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Daily summary generated",
  data: {
    date: "2026-01-14",
    summary: "The day started with a productive morning workout at the gym...",
    highlights: [
      "Morning gym session with great energy",
      "Team meeting about project milestones",
      "Code review and development work"
    ],
    topTopics: ["gym", "work", "meeting", "project", "weekend"],
    sentiment: "positive",
    wordCount: 2340
  }
}
```

---

## 13. Get Weekly Summary

**Endpoint:** `GET /api/transcripts/summary/weekly?endDate=2026-01-14`

**Description:** Generates an AI-powered summary of a week's transcripts (7 days ending on endDate).

### Query Parameters

- `endDate` (required): End date in YYYY-MM-DD format

### Request Example (Expo)

```typescript
const getWeeklySummary = async (endDate: string) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/transcripts/summary/weekly?endDate=${endDate}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching weekly summary:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Weekly summary generated",
  data: {
    startDate: "2026-01-08",
    endDate: "2026-01-14",
    summary: "This week showed a consistent pattern of morning workouts...",
    dailySummaries: [
      {
        date: "2026-01-14",
        summary: "...",
        highlights: ["..."],
        topTopics: ["gym", "work"],
        sentiment: "positive",
        wordCount: 2340
      }
    ],
    trends: [
      "Consistent morning exercise routine",
      "Increased team collaboration"
    ],
    topTopics: ["work", "gym", "meeting", "project", "team", "weekend"]
  }
}
```

---

## 14. Get User Chatrooms

**Endpoint:** `GET /api/transcripts/chatrooms?userId=679f1f77bcf86cd799439011&limit=30`

**Description:** Retrieves the user's transcript chatroom history (one chatroom per day).

### Query Parameters

- `userId` (required): MongoDB ObjectId of the user
- `limit` (optional): Max results (default: 30)

### Request Example (Expo)

```typescript
const getUserChatrooms = async (userId: string, limit = 30) => {
  try {
    const response = await fetch(
      `http://localhost:4000/api/transcripts/chatrooms?userId=${userId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching user chatrooms:', error);
    throw error;
  }
};
```

### Response

```typescript
{
  success: true,
  message: "Chatrooms retrieved",
  data: {
    chatrooms: [
      {
        _id: "679f1f77bcf86cd799439013",
        userId: "679f1f77bcf86cd799439011",
        date: "2026-01-12",
        createdAt: "2026-01-12T00:00:00.000Z",
        updatedAt: "2026-01-12T23:45:00.000Z"
      }
    ]
  }
}
```

---

## 🔧 Complete API Service (Expo)

Create a file `services/api.ts`:

```typescript
const BASE_URL = 'http://localhost:4000/api';

// ===== INTERFACES =====

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
}

export interface Message {
  id: string;
  content: string;
  messageType: 'user' | 'system' | 'transcription';
  createdAt: string;
}

export interface TranscriptChunk {
  id: string;
  text: string;
  timestamp: string;
  chunkNumber: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  topics: string[];
  score?: number; // For search results
}

export interface DailyContext {
  date: string;
  segments: Array<{
    hour: number;
    chunks: TranscriptChunk[];
    stats: {
      wordCount: number;
      sentiment: {
        positive: number;
        neutral: number;
        negative: number;
      };
    };
  }>;
  totalChunks: number;
  totalWords: number;
}

export interface DailySummary {
  date: string;
  summary: string;
  highlights: string[];
  topTopics: string[];
  sentiment: string;
  wordCount: number;
}

// ===== CHATROOM APIs =====

export const chatroomApi = {
  // Get today's chatroom
  getTodayChatroom: async (): Promise<Chatroom> => {
    const response = await fetch(`${BASE_URL}/chatrooms/today`);
    const data = await response.json();
    return data.data;
  },

  // Get chatroom by ID
  getChatroomById: async (chatroomId: string): Promise<Chatroom> => {
    const response = await fetch(`${BASE_URL}/chatrooms/${chatroomId}`);
    const data = await response.json();
    return data.data;
  },

  // Get all chatrooms
  getAllChatrooms: async (page = 1, limit = 20) => {
    const response = await fetch(
      `${BASE_URL}/chatrooms?page=${page}&limit=${limit}`
    );
    const data = await response.json();
    return data.data;
  },

  // Get messages (simple)
  getMessages: async (
    chatroomId: string,
    limit = 50
  ): Promise<Message[]> => {
    const response = await fetch(
      `${BASE_URL}/chatrooms/${chatroomId}/messages?limit=${limit}`
    );
    const data = await response.json();
    return data.data;
  },

  // Get paginated messages
  getPaginatedMessages: async (
    chatroomId: string,
    limit = 50,
    cursor?: string
  ) => {
    const url = cursor
      ? `${BASE_URL}/chatrooms/${chatroomId}/messages/paginated?limit=${limit}&cursor=${cursor}`
      : `${BASE_URL}/chatrooms/${chatroomId}/messages/paginated?limit=${limit}`;
    
    const response = await fetch(url);
    const data = await response.json();
    return data.data;
  },

  // Enter chatroom with context
  enterChatroom: async (
    chatroomId: string,
    userId?: string,
    message?: string
  ) => {
    const response = await fetch(
      `${BASE_URL}/chatrooms/${chatroomId}/enter`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, message }),
      }
    );
    const data = await response.json();
    return data.data;
  },
};

// ===== TRANSCRIPT APIs =====

export const transcriptApi = {
  // Ingest transcript chunk
  ingestTranscript: async (
    text: string,
    timestamp: string,
    chunkNumber?: number
  ) => {
    const response = await fetch(`${BASE_URL}/transcripts/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        timestamp,
        chunkNumber,
      }),
    });
    const data = await response.json();
    return data.data;
  },

  // Get daily context
  getDailyContext: async (date: string): Promise<DailyContext> => {
    const response = await fetch(
      `${BASE_URL}/transcripts/context/daily?date=${date}`
    );
    const data = await response.json();
    return data.data;
  },

  // Get hourly context
  getHourlyContext: async (date: string, hour: number) => {
    const response = await fetch(
      `${BASE_URL}/transcripts/context/hour?date=${date}&hour=${hour}`
    );
    const data = await response.json();
    return data.data;
  },

  // Semantic search
  semanticSearch: async (
    query: string,
    date?: string,
    limit = 10
  ) => {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });
    
    if (date) {
      params.append('date', date);
    }
    
    const response = await fetch(
      `${BASE_URL}/transcripts/context/search?${params}`
    );
    const data = await response.json();
    return data.data;
  },

  // Find similar events
  findSimilarEvents: async (chunkId: string, limit = 10) => {
    const response = await fetch(
      `${BASE_URL}/transcripts/context/similar?chunkId=${chunkId}&limit=${limit}`
    );
    const data = await response.json();
    return data.data;
  },

  // Get daily summary
  getDailySummary: async (date: string): Promise<DailySummary> => {
    const response = await fetch(
      `${BASE_URL}/transcripts/summary/daily?date=${date}`
    );
    const data = await response.json();
    return data.data;
  },

  // Get weekly summary
  getWeeklySummary: async (endDate: string) => {
    const response = await fetch(
      `${BASE_URL}/transcripts/summary/weekly?endDate=${endDate}`
    );
    const data = await response.json();
    return data.data;
  },

  // Get user chatrooms
  getUserChatrooms: async (userId: string, limit = 30) => {
    const response = await fetch(
      `${BASE_URL}/transcripts/chatrooms?userId=${userId}&limit=${limit}`
    );
    const data = await response.json();
    return data.data;
  },
};

// ===== COMBINED API =====
export const api = {
  ...chatroomApi,
  ...transcriptApi,
};
```

---

## 📱 Usage Examples in Expo Components

### Basic Chat Screen

```typescript
import { useEffect, useState } from 'react';
import { api } from './services/api';

const ChatScreen = ({ chatroomId }) => {
  const [messages, setMessages] = useState([]);
  const [chatroom, setChatroom] = useState(null);

  useEffect(() => {
    const loadChatroom = async () => {
      try {
        const data = await api.getChatroomById(chatroomId);
        setChatroom(data);
        
        const messagesData = await api.getMessages(chatroomId);
        setMessages(messagesData);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    loadChatroom();
  }, [chatroomId]);

  return (
    // Your chat UI here
  );
};
```

### Transcript Recording Screen

```typescript
import { useState } from 'react';
import { api } from './services/api';

const RecordingScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [chunkNumber, setChunkNumber] = useState(1);

  const handleTranscriptChunk = async (text: string) => {
    try {
      const timestamp = new Date().toISOString();
      
      await api.ingestTranscript(text, timestamp, chunkNumber);
      setChunkNumber(prev => prev + 1);
      
      console.log('Transcript chunk ingested successfully');
    } catch (error) {
      console.error('Error ingesting transcript:', error);
    }
  };

  return (
    // Your recording UI here
  );
};
```

### Daily Summary Screen

```typescript
import { useEffect, useState } from 'react';
import { api, DailySummary } from './services/api';

const DailySummaryScreen = () => {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const data = await api.getDailySummary(today);
        setSummary(data);
      } catch (error) {
        console.error('Error loading summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSummary();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <View>
      <Text style={styles.title}>Daily Summary</Text>
      <Text style={styles.summary}>{summary?.summary}</Text>
      
      <Text style={styles.subtitle}>Highlights:</Text>
      {summary?.highlights.map((highlight, index) => (
        <Text key={index} style={styles.highlight}>
          • {highlight}
        </Text>
      ))}
      
      <Text style={styles.subtitle}>Top Topics:</Text>
      <View style={styles.topicsContainer}>
        {summary?.topTopics.map((topic, index) => (
          <Text key={index} style={styles.topic}>
            #{topic}
          </Text>
        ))}
      </View>
    </View>
  );
};
```

### Search Screen

```typescript
import { useState } from 'react';
import { api, TranscriptChunk } from './services/api';

const SearchScreen = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TranscriptChunk[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const data = await api.semanticSearch(query, undefined, 20);
      setResults(data.chunks);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search your transcripts..."
        onSubmitEditing={handleSearch}
      />
      
      <FlatList
        data={results}
        renderItem={({ item }) => (
          <View style={styles.resultItem}>
            <Text style={styles.resultText}>{item.text}</Text>
            <Text style={styles.resultScore}>
              Score: {(item.score * 100).toFixed(1)}%
            </Text>
            <Text style={styles.resultTime}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

---

## 🌐 Message & Data Types

### Message Types
- **user**: Message from a user
- **system**: Message from AI assistant (Gemini)
- **transcription**: Message from audio transcription

### Sentiment Types
- **positive**: Positive sentiment detected
- **neutral**: Neutral sentiment
- **negative**: Negative sentiment detected

### Transcript Features
- **Automatic Chatroom Management**: Creates 24-hour windows automatically
- **NLP Analysis**: Sentiment and topic extraction
- **Vector Embeddings**: Semantic search capabilities
- **AI Summaries**: Daily and weekly summaries using Gemini AI

---

## ⚠️ Important Notes

1. **Base URL**: Update `http://localhost:4000` to your production URL when deploying
2. **MongoDB ObjectId Format**: User IDs and chunk IDs must be 24 hexadecimal characters
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Pagination**: Use paginated endpoints for better performance with large datasets
5. **Context Loading**: Provide valid userId for transcript-aware AI responses
6. **Automatic Management**: Transcript ingestion automatically creates chatrooms and segments
7. **ChromaDB Optional**: Vector search works only if ChromaDB is running
8. **Single User System**: No authentication required (default userId: `000000000000000000000000`)

---

## 🚀 Quick Start Workflow

### 1. Recording & Ingestion
```typescript
// Start recording and ingest transcript chunks
await api.ingestTranscript(
  "Started my morning workout at the gym",
  "2026-01-17T08:15:00.000Z",
  1
);
```

### 2. Get Today's Chat
```typescript
// Get or create today's chatroom
const chatroom = await api.getTodayChatroom();
```

### 3. Enter with Context
```typescript
// Enter chatroom with transcript context
const result = await api.enterChatroom(
  chatroom.id,
  "507f1f77bcf86cd799439011",
  "What did I do this morning?"
);
```

### 4. Search & Analyze
```typescript
// Search transcripts
const searchResults = await api.semanticSearch("gym workout");

// Get daily summary
const summary = await api.getDailySummary("2026-01-17");
```

---

## 🔗 Related Documentation

- Socket.IO integration for real-time messaging
- ChromaDB setup for vector search
- Gemini AI configuration
- MongoDB setup and indexing
