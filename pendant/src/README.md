# Pendant Frontend Architecture

This directory contains the core application logic organized following clean architecture principles, similar to the backend structure.

## Directory Structure

```
src/
├── config/          # Application configuration
│   ├── index.ts     # Main config exports
│   └── theme.ts     # Theme configuration
│
├── constants/       # Application constants
│   └── index.ts     # API endpoints, socket events, timeouts, etc.
│
├── hooks/           # Custom React hooks
│   ├── index.ts     # Hook exports
│   ├── useChat.ts   # Socket.IO chat hook
│   └── useWarmUpBrowser.ts  # Browser warm-up hook
│
├── services/        # Business logic and external integrations
│   ├── index.ts     # Service exports
│   ├── api.service.ts       # REST API service
│   ├── auth.service.ts      # Authentication service
│   ├── network.service.tsx  # Network status service
│   └── socket.service.ts    # Socket.IO service
│
├── types/           # TypeScript type definitions
│   └── index.ts     # Shared types and interfaces
│
└── utils/           # Utility functions
    ├── index.ts     # Utility exports (cn function)
    ├── logger.ts    # Logging utility
    ├── permissions.ts  # Permission utilities
    └── toast.ts     # Toast notification utility
```

## Import Patterns

### Services
```typescript
import { api, BACKEND_URL } from '@/src/services/api.service';
import socketService from '@/src/services/socket.service';
import { tokenCache } from '@/src/services/auth.service';
import { NetworkProvider } from '@/src/services/network.service';
```

### Hooks
```typescript
import { useChat } from '@/src/hooks/useChat';
import { useWarmUpBrowser } from '@/src/hooks/useWarmUpBrowser';
```

### Utils
```typescript
import { cn, logger, toast } from '@/src/utils';
import { requestPermissions } from '@/src/utils/permissions';
```

### Constants
```typescript
import { API_ENDPOINTS, SOCKET_EVENTS, TIMEOUTS } from '@/src/constants';
```

### Types
```typescript
import type { ChatMessage, Chatroom, ApiResponse } from '@/src/types';
```

### Config
```typescript
import { config } from '@/src/config';
import { NAV_THEME } from '@/src/config/theme';
```

## Architecture Principles

### 1. Separation of Concerns
- **Services**: Handle external integrations (API, Socket.IO, Auth)
- **Hooks**: Manage component state and side effects
- **Utils**: Pure utility functions
- **Types**: Type definitions shared across the app
- **Constants**: Immutable configuration values

### 2. Single Responsibility
Each file has a single, well-defined purpose:
- `api.service.ts`: All REST API calls
- `socket.service.ts`: Socket.IO connection management
- `useChat.ts`: Chat state management
- `logger.ts`: Logging functionality

### 3. Dependency Direction
```
Components → Hooks → Services → Utils
                  ↓
              Constants
                  ↓
                Types
```

### 4. Type Safety
- All services return typed responses
- Shared types in `types/index.ts`
- No `any` types except where absolutely necessary

## Service Layer

### API Service (`api.service.ts`)
Handles all REST API communication with the backend.

**Key Functions:**
- `getTodayChatroom()`: Get today's chatroom
- `getChatroomMessages(id)`: Get messages for a chatroom
- `getUserChatrooms(limit)`: Get user's chatroom history
- `semanticSearch(query, date, limit)`: Search transcripts
- `getDailySummary(date)`: Get daily summary
- `getWeeklySummary(endDate)`: Get weekly summary

### Socket Service (`socket.service.ts`)
Manages Socket.IO connections with auto-reconnection.

**Key Methods:**
- `connect(serverUrl)`: Connect to Socket.IO server
- `disconnect()`: Disconnect from server
- `getSocket()`: Get socket instance
- `isConnected()`: Check connection status

### Auth Service (`auth.service.ts`)
Handles authentication token caching for Clerk.

### Network Service (`network.service.tsx`)
Provides network status context to the app.

## Hook Layer

### useChat Hook
Manages chat state and Socket.IO events.

**Returns:**
- `messages`: Array of chat messages
- `chatroom`: Current chatroom info
- `isConnected`: Socket connection status
- `isTyping`: AI typing indicator
- `streamingText`: Streaming response text
- `sendMessage(content, username)`: Send a message
- `connect(serverUrl)`: Connect to chat
- `disconnect()`: Disconnect from chat

## Constants

### Socket Events
```typescript
SOCKET_EVENTS.MESSAGE_SEND        // 'message:send'
SOCKET_EVENTS.CHATROOM_JOINED     // 'chatroom:joined'
SOCKET_EVENTS.MESSAGE_RECEIVED    // 'message:received'
SOCKET_EVENTS.AI_TYPING           // 'ai:typing'
SOCKET_EVENTS.AI_STREAMING        // 'ai:streaming'
SOCKET_EVENTS.ERROR               // 'error'
```

### API Endpoints
```typescript
API_ENDPOINTS.CHATROOMS                    // '/chatrooms'
API_ENDPOINTS.CHATROOM_BY_ID(id)          // '/chatrooms/:id'
API_ENDPOINTS.CHATROOM_MESSAGES(id)       // '/chatrooms/:id/messages'
API_ENDPOINTS.DAILY_SUMMARY               // '/history/daily'
API_ENDPOINTS.WEEKLY_SUMMARY              // '/history/weekly'
API_ENDPOINTS.SEARCH                      // '/search'
```

### Timeouts
```typescript
TIMEOUTS.API_REQUEST           // 30000ms
TIMEOUTS.SOCKET_RECONNECT      // 1000ms
TIMEOUTS.SOCKET_MAX_RETRIES    // 5
```

## Best Practices

### 1. Import from Index Files
```typescript
// ✅ Good
import { api, socketService } from '@/src/services';
import { useChat } from '@/src/hooks';
import { logger, toast } from '@/src/utils';

// ❌ Avoid
import { api } from '@/src/services/api.service';
import { useChat } from '@/src/hooks/useChat';
```

### 2. Use Constants
```typescript
// ✅ Good
socket.emit(SOCKET_EVENTS.MESSAGE_SEND, data);

// ❌ Avoid
socket.emit('message:send', data);
```

### 3. Type Everything
```typescript
// ✅ Good
const messages: ChatMessage[] = await api.getChatroomMessages(id);

// ❌ Avoid
const messages = await api.getChatroomMessages(id);
```

### 4. Error Handling
```typescript
// ✅ Good
try {
  const data = await api.getTodayChatroom();
  if (!data) {
    toast.error('Failed to load chatroom');
    return;
  }
  // Use data
} catch (error) {
  logger.error('Error:', error);
  toast.error('An error occurred');
}
```

## Migration from Old Structure

Old imports have been updated:
- `@/lib/api` → `@/src/services/api.service`
- `@/lib/auth` → `@/src/services/auth.service`
- `@/lib/socket.service` → `@/src/services/socket.service`
- `@/lib/network-context` → `@/src/services/network.service`
- `@/lib/hooks/useChat` → `@/src/hooks/useChat`
- `@/lib/useWarmUpBrowser` → `@/src/hooks/useWarmUpBrowser`
- `@/lib/utils` → `@/src/utils`
- `@/lib/logger` → `@/src/utils/logger`
- `@/lib/toast` → `@/src/utils/toast`
- `@/lib/permissions` → `@/src/utils/permissions`
- `@/lib/theme` → `@/src/config/theme`

## Testing

When writing tests, import from the same paths:
```typescript
import { api } from '@/src/services/api.service';
import { useChat } from '@/src/hooks/useChat';
```

## Future Additions

Consider adding these directories as the app grows:
- `src/models/` - Data models and business logic
- `src/repositories/` - Data access layer
- `src/mappers/` - Data transformation functions
- `src/validators/` - Input validation
- `src/middlewares/` - Request/response interceptors
