#!/bin/bash

# Chatroom API Test Script
# Base URL
BASE_URL="http://localhost:4000/api"

echo "=========================================="
echo "Testing Chatroom API Endpoints"
echo "=========================================="
echo ""

# Test 1: Get Today's Chatroom
echo "1. Testing GET /chatrooms/today"
echo "---"
RESPONSE=$(curl -s -X GET "$BASE_URL/chatrooms/today" -H "Content-Type: application/json")
echo "$RESPONSE" | jq '.'
CHATROOM_ID=$(echo "$RESPONSE" | jq -r '.data.id')
echo "Chatroom ID: $CHATROOM_ID"
echo ""

# Test 2: Get Chatroom By ID
echo "2. Testing GET /chatrooms/:chatroomId"
echo "---"
curl -s -X GET "$BASE_URL/chatrooms/$CHATROOM_ID" -H "Content-Type: application/json" | jq '.'
echo ""

# Test 3: Get All Chatrooms (with pagination)
echo "3. Testing GET /chatrooms?page=1&limit=5"
echo "---"
curl -s -X GET "$BASE_URL/chatrooms?page=1&limit=5" -H "Content-Type: application/json" | jq '.'
echo ""

# Test 4: Get Chatroom Messages (Simple)
echo "4. Testing GET /chatrooms/:chatroomId/messages?limit=10"
echo "---"
curl -s -X GET "$BASE_URL/chatrooms/$CHATROOM_ID/messages?limit=10" -H "Content-Type: application/json" | jq '.'
echo ""

# Test 5: Get Paginated Messages
echo "5. Testing GET /chatrooms/:chatroomId/messages/paginated?limit=10"
echo "---"
PAGINATED_RESPONSE=$(curl -s -X GET "$BASE_URL/chatrooms/$CHATROOM_ID/messages/paginated?limit=10" -H "Content-Type: application/json")
echo "$PAGINATED_RESPONSE" | jq '.'
NEXT_CURSOR=$(echo "$PAGINATED_RESPONSE" | jq -r '.data.pagination.nextCursor')
echo ""

# Test 5b: Get Next Page (if cursor exists)
if [ "$NEXT_CURSOR" != "null" ] && [ -n "$NEXT_CURSOR" ]; then
  echo "5b. Testing GET /chatrooms/:chatroomId/messages/paginated with cursor"
  echo "---"
  curl -s -X GET "$BASE_URL/chatrooms/$CHATROOM_ID/messages/paginated?limit=10&cursor=$NEXT_CURSOR" -H "Content-Type: application/json" | jq '.'
  echo ""
fi

# Test 6: Enter Chatroom (without context or message)
echo "6. Testing POST /chatrooms/:chatroomId/enter (no context, no message)"
echo "---"
curl -s -X POST "$BASE_URL/chatrooms/$CHATROOM_ID/enter" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# Test 7: Enter Chatroom (with message only)
echo "7. Testing POST /chatrooms/:chatroomId/enter (with message)"
echo "---"
curl -s -X POST "$BASE_URL/chatrooms/$CHATROOM_ID/enter" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from test script!"}' | jq '.'
echo ""

# Test 8: Enter Chatroom (with userId and message)
echo "8. Testing POST /chatrooms/:chatroomId/enter (with userId and message)"
echo "---"
# Note: Replace with a valid MongoDB ObjectId from your database
TEST_USER_ID="507f1f77bcf86cd799439011"
curl -s -X POST "$BASE_URL/chatrooms/$CHATROOM_ID/enter" \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$TEST_USER_ID\",\"message\":\"What did I talk about today?\"}" | jq '.'
echo ""

echo "=========================================="
echo "All tests completed!"
echo "=========================================="
