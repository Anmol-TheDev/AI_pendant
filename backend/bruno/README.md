# AI_pendent Backend API - Bruno Collection

This Bruno collection contains comprehensive API documentation for the AI_pendent backend application.

## 📋 Collection Structure

### 🏥 Health Check
- **GET** `/api/healthz` - Server health check endpoint

### 🔐 Authentication (`/api/auth`)
- **GET** `/api/auth/me` - Get current authenticated user
- **PUT** `/api/auth/preferences` - Update user preferences

### 🔔 Webhooks (`/api/webhooks`)
- **POST** `/api/webhooks/clerk` - Clerk user event webhook handler

### 💬 Chatrooms (`/api/chatrooms`)
- Daily chatroom management and messaging

### 📝 Transcripts (`/api/transcripts`)
- **POST** `/api/transcripts/ingest` - Ingest transcript chunks
- **GET** `/api/transcripts/context/daily` - Get daily context
- **GET** `/api/transcripts/context/hour` - Get hourly context
- **GET** `/api/transcripts/context/search` - Semantic search
- **GET** `/api/transcripts/context/similar` - Find similar events
- **GET** `/api/transcripts/summary/daily` - Generate daily summary
- **GET** `/api/transcripts/summary/weekly` - Generate weekly summary
- **GET** `/api/transcripts/chatrooms` - Get user's chatroom history

## 🚀 Getting Started

### 1. Environment Setup

The collection includes a `local` environment with the following variables:

```
baseURL: http://localhost:4000
clerkToken: your_clerk_session_token_here
```

**To get your Clerk token:**
1. Log in to your application frontend
2. Open browser DevTools → Network tab
3. Look for API requests with Authorization header
4. Copy the Bearer token value
5. Update `clerkToken` in the local environment

### 2. Authentication

Most endpoints require Clerk authentication. The collection is pre-configured to use Bearer token authentication with the `{{clerkToken}}` variable.

**Headers sent automatically:**
```
Authorization: Bearer {{clerkToken}}
```

### 3. Running Requests

1. Select the `local` environment in Bruno
2. Update the `clerkToken` variable with your session token
3. Run any authenticated endpoint

## 📖 API Endpoints Documentation

### Transcript System Overview

The transcript system provides a scalable backend for storing continuous transcript text, segmented by day/hour, with semantic AI querying capabilities using MongoDB + Vector DB.

**Key Features:**
- **Automatic chatroom creation** - No manual setup needed, just send transcripts with timestamps
- **24-hour windows** - Each chatroom represents a 24-hour period ("Day 1", "Day 2", etc.)
- **Hour-based segments** - Automatic organization into hourly buckets (0-23)
- **NLP analysis** - Automatic sentiment detection and topic extraction
- **Vector embeddings** - Semantic search powered by ChromaDB
- **AI-powered summaries** - Daily and weekly summaries using Gemini AI

**Data Flow:**
1. External transcription service sends chunks via `/ingest` with timestamp
2. System automatically creates/finds appropriate 24-hour chatroom
3. Creates/finds hourly segment within chatroom
4. Runs NLP analysis and generates embeddings
5. Stores in MongoDB + ChromaDB (optional)
6. Updates statistics and metadata

**Chatroom Management:**
- **Automatic creation** - First transcript creates "Day 1", next day creates "Day 2", etc.
- **Smart detection** - System finds existing chatroom for timestamp or creates new one
- **No manual intervention** - Backend handles all chatroom lifecycle
- **Sequential organization** - Chatrooms are numbered sequentially (1, 2, 3...)
- **24-hour windows** - Each chatroom spans exactly 24 hours from first transcript

### Authentication Endpoints

#### Get Current User
**Endpoint:** `GET /api/auth/me`  
**Authentication:** Required (Bearer Token)

**Response Example:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "clerkId": "user_2abc123def456",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "imageUrl": "https://img.clerk.com/...",
      "isActive": true,
      "createdAt": "2026-01-10T10:00:00.000Z"
    }
  }
}
```

#### Update User Preferences
**Endpoint:** `PUT /api/auth/preferences`  
**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "preferences": {
    "theme": "dark",
    "notifications": true,
    "language": "en",
    "timezone": "UTC"
  }
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "clerkId": "user_2abc123def456",
      "email": "user@example.com",
      "metadata": {
        "preferences": {
          "theme": "dark",
          "notifications": true,
          "language": "en",
          "timezone": "UTC"
        },
        "lastLoginAt": "2026-01-11T09:47:00.000Z"
      }
    }
  }
}
```

### Webhook Endpoints

#### Clerk Webhook
**Endpoint:** `POST /api/webhooks/clerk`  
**Authentication:** None (Svix signature verification)

**Important:** This endpoint is called by Clerk, not your frontend application.

**Supported Events:**
- `user.created` - New user registration
- `user.updated` - User profile update
- `user.deleted` - User deletion

**Headers (Required by Clerk):**
```
svix-id: msg_unique_id
svix-timestamp: 1673000000
svix-signature: v1,signature_hash
Content-Type: application/json
```

**Request Body Example (user.created):**
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123def456",
    "email_addresses": [
      {
        "email_address": "newuser@example.com",
        "id": "idn_2xyz789"
      }
    ],
    "username": "newuser",
    "first_name": "John",
    "last_name": "Doe",
    "image_url": "https://img.clerk.com/..."
  }
}
```

**Setup Instructions:**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/) → Webhooks
2. Click "Add Endpoint"
3. Enter: `https://your-domain.com/api/webhooks/clerk`
4. Subscribe to: `user.created`, `user.updated`, `user.deleted`
5. Copy webhook secret to `.env` as `CLERK_WEBHOOK_SECRET`

### Transcript Endpoints

See the `transcripts` folder for detailed documentation on:
- **Ingesting transcript chunks** - Automatic chatroom creation based on timestamps
- **Retrieving daily/hourly context** - Query transcripts by day or hour
- **Semantic search capabilities** - Vector-based search across all transcripts
- **Finding similar events** - Discover related transcript chunks
- **Generating AI summaries** - Daily and weekly summaries powered by Gemini AI

**Quick Start:**
1. **Ingest transcripts** - `POST /api/transcripts/ingest` with text and timestamp
   - Backend automatically creates "Day 1", "Day 2", etc. based on timestamps
   - No need to manually create chatrooms!
2. **Query context** - `GET /api/transcripts/context/daily?dayNumber=1`
3. **Search semantically** - `GET /api/transcripts/context/search?query=gym`
4. **Generate summaries** - `GET /api/transcripts/summary/daily?dayNumber=1`

**Example Workflow:**
```bash
# Day 1 - First transcript (creates "Day 1" automatically)
POST /api/transcripts/ingest
{
  "text": "Started gym again after months. Weighed 72.9kg.",
  "timestamp": "2026-01-14T08:15:00.000Z"
}

# Day 1 - Another transcript (uses same "Day 1")
POST /api/transcripts/ingest
{
  "text": "Had protein shake after workout.",
  "timestamp": "2026-01-14T09:30:00.000Z"
}

# Day 2 - Next day (creates "Day 2" automatically)
POST /api/transcripts/ingest
{
  "text": "Morning weight: 72.5kg. Lost 400g!",
  "timestamp": "2026-01-15T08:00:00.000Z"
}

# Query Day 1 transcripts
GET /api/transcripts/context/daily?dayNumber=1
```

## 🔧 Environment Variables

Ensure your `.env` file has the following variables:

```bash
# Server Configuration
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URL=mongodb://localhost:27017/ai_pendent

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_secret_here

# Gemini AI (for NLP and summaries)
GEMINI_API_KEY=your_gemini_api_key_here

# ChromaDB (optional - for vector search)
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=audio_chunks
```

## 🛠️ Utility Scripts

The backend includes helpful scripts for managing transcript data:

### Check Chatrooms
```bash
npm run check:chatrooms
```
View all chatrooms and transcript chunks in the database. Useful for debugging and verifying data.

### Cleanup Invalid Chatrooms
```bash
npm run cleanup:chatrooms
```
Remove corrupted chatrooms with invalid `dayNumber` values. Run this if you encounter validation errors.

## ✅ Testing

The collection includes test assertions for validation. Tests automatically run when you execute requests.

**Example tests for Get Current User:**
- Status code is 200
- Response has `success` field set to `true`
- Response contains user data
- User object has required fields (id, email, clerkId)

## 🐛 Troubleshooting

### 401 Unauthorized
- Ensure your `clerkToken` is valid and not expired
- Clerk session tokens typically expire after 1 hour
- Get a fresh token from your application

### 500 Internal Server Error
- Check if MongoDB is running
- Verify all environment variables are set correctly
- Check server logs for detailed error messages

### Webhook 400 Bad Request
- Verify Svix headers are present
- Check webhook secret matches in Clerk Dashboard and `.env`
- Ensure request body matches expected format

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Bruno Documentation](https://docs.usebruno.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 🤝 Contributing

When adding new endpoints:
1. Create a new `.bru` file in the appropriate folder
2. Include comprehensive documentation in the `docs` section
3. Add example request/response bodies
4. Include test assertions when applicable
