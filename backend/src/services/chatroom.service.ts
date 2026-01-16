import mongoose from 'mongoose';
import { Chatroom, IChatroom } from '../models/Chatroom';
import { ChatMessage, IChatMessage } from '../models/ChatMessage';
import { logger } from '../utils';

/**
 * Chatroom Service
 * Handles chatroom and message operations
 */

/**
 * Get or create chatroom for today
 */
export const getTodayChatroom = async (): Promise<IChatroom> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let chatroom = await Chatroom.findOne({ date: today });

  if (!chatroom) {
    const formattedDate = today.toISOString().split('T')[0];
    chatroom = await Chatroom.create({
      date: today,
      name: `Daily Chat - ${formattedDate}`,
      description: `Chatroom for ${formattedDate}`,
      isActive: true,
    });
    logger.info('Created new chatroom for today', { chatroomId: chatroom._id });
  }

  return chatroom;
};

/**
 * Get chatroom by ID
 */
export const getChatroomById = async (
  chatroomId: string
): Promise<IChatroom | null> => {
  if (!mongoose.Types.ObjectId.isValid(chatroomId)) {
    return null;
  }
  return Chatroom.findById(chatroomId);
};

/**
 * Create a user message
 */
export const createUserMessage = async (
  chatroomId: string,
  content: string,
  userId?: string
): Promise<IChatMessage> => {
  const message = await ChatMessage.create({
    chatroomId,
    userId: userId || undefined,
    messageType: 'user',
    content,
  });

  logger.info('User message created', { 
    messageId: message._id, 
    chatroomId 
  });

  return message;
};

/**
 * Create an AI system message
 */
export const createAIMessage = async (
  chatroomId: string,
  content: string
): Promise<IChatMessage> => {
  const message = await ChatMessage.create({
    chatroomId,
    messageType: 'system',
    content,
  });

  logger.info('AI message created', { 
    messageId: message._id, 
    chatroomId 
  });

  return message;
};

/**
 * Get recent messages from a chatroom
 */
export const getRecentMessages = async (
  chatroomId: string,
  limit: number = 50
): Promise<IChatMessage[]> => {
  return ChatMessage.find({ 
    chatroomId, 
    isDeleted: false 
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

/**
 * Get paginated messages for infinite scroll
 * Returns messages in chronological order (oldest first) for display
 */
export const getPaginatedMessages = async (
  chatroomId: string,
  limit: number = 50,
  cursor?: string // Message ID to paginate from
): Promise<{
  messages: IChatMessage[];
  hasMore: boolean;
  nextCursor: string | null;
  totalCount: number;
}> => {
  const query: any = {
    chatroomId,
    isDeleted: false,
  };

  // If cursor is provided, get messages older than this cursor
  if (cursor) {
    const cursorMessage = await ChatMessage.findById(cursor);
    if (cursorMessage) {
      query.createdAt = { $lt: cursorMessage.createdAt };
    }
  }

  // Get messages in reverse chronological order (newest first for pagination)
  const messages = await ChatMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1); // Get one extra to check if there are more

  // Check if there are more messages
  const hasMore = messages.length > limit;
  
  // Remove the extra message if it exists
  const paginatedMessages = hasMore ? messages.slice(0, limit) : messages;

  // Reverse to get chronological order (oldest first) for display
  const orderedMessages = [...paginatedMessages].reverse();

  // Get the next cursor (oldest message ID in this batch)
  const nextCursor = hasMore && paginatedMessages.length > 0
    ? paginatedMessages[paginatedMessages.length - 1]._id.toString()
    : null;

  // Get total count
  const totalCount = await ChatMessage.countDocuments({
    chatroomId,
    isDeleted: false,
  });

  return {
    messages: orderedMessages,
    hasMore,
    nextCursor,
    totalCount,
  };
};

/**
 * Get all chatrooms with last message
 */
export const getAllChatrooms = async (
  page: number = 1,
  limit: number = 20
): Promise<{
  chatrooms: Array<{
    chatroom: IChatroom;
    lastMessage: IChatMessage | null;
  }>;
  total: number;
  hasMore: boolean;
}> => {
  const skip = (page - 1) * limit;

  // Find all active chatrooms
  const chatrooms = await Chatroom.find({
    isActive: true,
  })
    .sort({ 'stats.lastMessageAt': -1 })
    .skip(skip)
    .limit(limit + 1);

  const hasMore = chatrooms.length > limit;
  const paginatedChatrooms = hasMore ? chatrooms.slice(0, limit) : chatrooms;

  // Get last message for each chatroom
  const chatroomsWithMessages = await Promise.all(
    paginatedChatrooms.map(async (chatroom) => {
      const lastMessage = await ChatMessage.findOne({
        chatroomId: chatroom._id,
        isDeleted: false,
      })
        .sort({ createdAt: -1 });

      return {
        chatroom,
        lastMessage,
      };
    })
  );

  const total = await Chatroom.countDocuments({
    isActive: true,
  });

  return {
    chatrooms: chatroomsWithMessages,
    total,
    hasMore,
  };
};

/**
 * Get conversation history for AI context
 */
export const getConversationHistory = async (
  chatroomId: string,
  limit: number = 10
): Promise<{ role: string; content: string }[]> => {
  const messages = await ChatMessage.find({ 
    chatroomId, 
    isDeleted: false 
  })
    .sort({ createdAt: -1 })
    .limit(limit);

  return messages
    .reverse()
    .map(msg => ({
      role: msg.messageType === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
};

/**
 * Enter chatroom and get transcript context for that day
 */
export const enterChatroom = async (
  chatroomId: string,
  userId?: string
): Promise<{
  chatroom: IChatroom;
  transcriptContext: string | null;
  contextSummary: {
    hasContext: boolean;
    totalChunks: number;
    totalWords: number;
    timeRange?: { start: Date; end: Date };
  };
}> => {
  // Get the chatroom
  const chatroom = await getChatroomById(chatroomId);
  if (!chatroom) {
    throw new Error('Chatroom not found');
  }

  // If no userId provided, return chatroom without transcript context
  if (!userId) {
    return {
      chatroom,
      transcriptContext: null,
      contextSummary: {
        hasContext: false,
        totalChunks: 0,
        totalWords: 0,
      },
    };
  }

  // Validate and convert userId to ObjectId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    logger.warn('Invalid userId format, skipping transcript context', { userId });
    return {
      chatroom,
      transcriptContext: null,
      contextSummary: {
        hasContext: false,
        totalChunks: 0,
        totalWords: 0,
      },
    };
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Import transcript models
  const { TranscriptChatroom } = await import('../models/TranscriptChatroom');
  const { TranscriptSegment } = await import('../models/TranscriptSegment');
  const { TranscriptChunk } = await import('../models/TranscriptChunk');

  // Find transcript chatroom for the same date
  const chatroomDate = new Date(chatroom.date);
  chatroomDate.setHours(0, 0, 0, 0);

  // Find transcript chatroom that overlaps with this date
  const transcriptChatroom = await TranscriptChatroom.findOne({
    userId: userObjectId,
    startTime: { $lte: new Date(chatroomDate.getTime() + 24 * 60 * 60 * 1000) },
    endTime: { $gte: chatroomDate },
  });

  if (!transcriptChatroom) {
    logger.info('No transcript context found for chatroom', { chatroomId });
    return {
      chatroom,
      transcriptContext: null,
      contextSummary: {
        hasContext: false,
        totalChunks: 0,
        totalWords: 0,
      },
    };
  }

  // Get all segments for this transcript chatroom
  const segments = await TranscriptSegment.find({ 
    chatroomId: transcriptChatroom._id 
  }).sort({ hour: 1 });

  if (segments.length === 0) {
    return {
      chatroom,
      transcriptContext: null,
      contextSummary: {
        hasContext: false,
        totalChunks: 0,
        totalWords: 0,
      },
    };
  }

  // Build transcript context
  let contextText = `# Transcript Context for ${chatroom.name}\n\n`;
  contextText += `Date: ${chatroomDate.toISOString().split('T')[0]}\n`;
  contextText += `Transcript Period: ${transcriptChatroom.name} (${transcriptChatroom.startTime.toISOString()} to ${transcriptChatroom.endTime.toISOString()})\n\n`;

  let totalChunks = 0;
  let totalWords = 0;

  for (const segment of segments) {
    const chunks = await TranscriptChunk.find({ segmentId: segment._id })
      .sort({ timestamp: 1 })
      .select('text timestamp topics sentiment');

    if (chunks.length === 0) continue;

    contextText += `## Hour ${segment.hour}:00\n\n`;

    for (const chunk of chunks) {
      const time = chunk.timestamp.toISOString().split('T')[1].substring(0, 5);
      contextText += `[${time}] ${chunk.text}\n`;
      totalChunks++;
      totalWords += chunk.text.split(/\s+/).length;
    }

    contextText += `\n`;
  }

  logger.info('Transcript context retrieved', { 
    chatroomId, 
    totalChunks, 
    totalWords 
  });

  return {
    chatroom,
    transcriptContext: contextText,
    contextSummary: {
      hasContext: true,
      totalChunks,
      totalWords,
      timeRange: {
        start: transcriptChatroom.startTime,
        end: transcriptChatroom.endTime,
      },
    },
  };
};
