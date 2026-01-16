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
- Automatic daily chatroom creation (1 per user per day)
- Hour-based segment organization (0-23)
- NLP analysis (sentiment + topics)
- Vector embeddings for semantic search
- AI-powered daily and weekly summaries

**Data Flow:**
1. External transcription service sends chunks via `/ingest`
2. System creates/resolves chatroom and segment
3. Runs NLP analysis and generates embeddings
4. Stores in MongoDB + Vector DB
5. Updates statistics and metadata

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
- Ingesting transcript chunks
- Retrieving daily/hourly context
- Semantic search capabilities
- Finding similar events
- Generating AI summaries

**Quick Start:**
1. Ingest transcript chunks via `POST /api/transcripts/ingest`
2. Query context via `GET /api/transcripts/context/daily`
3. Search semantically via `GET /api/transcripts/context/search`
4. Generate summaries via `GET /api/transcripts/summary/daily`

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
```

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
