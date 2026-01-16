# Chatroom API Documentation for Expo App

Base URL: `http://localhost:4000` (Development)

## 📋 Table of Contents

1. [Get Today's Chatroom](#1-get-todays-chatroom)
2. [Get Chatroom By ID](#2-get-chatroom-by-id)
3. [Get All Chatrooms](#3-get-all-chatrooms)
4. [Get Chatroom Messages (Simple)](#4-get-chatroom-messages-simple)
5. [Get Paginated Messages](#5-get-paginated-messages-infinite-scroll)
6. [Enter Chatroom with Context](#6-enter-chatroom-with-context)

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

## 🔧 Complete API Service (Expo)

Create a file `services/chatroomApi.ts`:

```typescript
const BASE_URL = 'http://localhost:4000/api';

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
```

---

## 📱 Usage in Expo Components

```typescript
import { useEffect, useState } from 'react';
import { chatroomApi } from './services/chatroomApi';

// Example: Get today's chatroom
const HomeScreen = () => {
  const [chatroom, setChatroom] = useState(null);

  useEffect(() => {
    const loadChatroom = async () => {
      try {
        const data = await chatroomApi.getTodayChatroom();
        setChatroom(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    loadChatroom();
  }, []);

  return (
    // Your UI here
  );
};
```

---

## 🌐 Message Types

- **user**: Message from a user
- **system**: Message from AI assistant (Gemini)
- **transcription**: Message from audio transcription

---

## ⚠️ Important Notes

1. **Base URL**: Update `http://localhost:4000` to your production URL when deploying
2. **MongoDB ObjectId Format**: User IDs must be 24 hexadecimal characters
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Pagination**: Use paginated endpoint for better performance with large message histories
5. **Context Loading**: Provide valid userId for transcript-aware AI responses

---

## 🔗 Related Documentation

- Socket.IO integration for real-time messaging
- Transcript system documentation
- Authentication setup (if needed)
