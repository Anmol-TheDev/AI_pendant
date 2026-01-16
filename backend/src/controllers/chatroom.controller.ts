import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccessResponse } from '../utils/responseHandler';
import * as chatroomService from '../services/chatroom.service';
import { success as successMessages } from '../constants/messages';

/**
 * Get today's chatroom
 */
export const getTodayChatroom = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const chatroom = await chatroomService.getTodayChatroom();

    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Chatroom'),
      {
        id: chatroom._id,
        name: chatroom.name,
        description: chatroom.description,
        date: chatroom.date,
        isActive: chatroom.isActive,
        stats: chatroom.stats,
      }
    );
  }
);

/**
 * Get chatroom by ID
 */
export const getChatroomById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const chatroom = await chatroomService.getChatroomById(id as string);

    if (!chatroom) {
      res.status(404).json({
        success: false,
        message: 'Chatroom not found',
      });
      return;
    }

    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Chatroom'),
      {
        id: chatroom._id,
        name: chatroom.name,
        description: chatroom.description,
        date: chatroom.date,
        isActive: chatroom.isActive,
        stats: chatroom.stats,
      }
    );
  }
);

/**
 * Get messages from a chatroom
 */
export const getChatroomMessages = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await chatroomService.getRecentMessages(id as string, limit);

    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Messages'),
      messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
      }))
    );
  }
);

/**
 * Get paginated messages for infinite scroll
 */
export const getPaginatedMessages = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const cursor = req.query.cursor as string | undefined;

    const result = await chatroomService.getPaginatedMessages(id as string, limit, cursor);

    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Messages'),
      {
        messages: result.messages.map(msg => ({
          id: msg._id,
          content: msg.content,
          messageType: msg.messageType,
          createdAt: msg.createdAt,
        })),
        pagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          totalCount: result.totalCount,
          currentCount: result.messages.length,
        },
      }
    );
  }
);

/**
 * Get all chatrooms
 */
export const getAllChatrooms = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await chatroomService.getAllChatrooms(page, limit);

    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Chatrooms'),
      {
        chatrooms: result.chatrooms.map(item => ({
          id: item.chatroom._id,
          name: item.chatroom.name,
          description: item.chatroom.description,
          date: item.chatroom.date,
          isActive: item.chatroom.isActive,
          stats: item.chatroom.stats,
          lastMessage: item.lastMessage ? {
            id: item.lastMessage._id,
            content: item.lastMessage.content,
            messageType: item.lastMessage.messageType,
            createdAt: item.lastMessage.createdAt,
          } : null,
        })),
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
        },
      }
    );
  }
);

/**
 * Enter chatroom with transcript context
 */
export const enterChatroom = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { userId, message } = req.body;
    const messageLimit = parseInt(req.query.limit as string) || 50;

    const result = await chatroomService.enterChatroom(id as string, userId, messageLimit);

    // Build system prompt with context
    let systemPrompt = `You are a helpful AI assistant in a daily chatroom.`;

    if (result.transcriptContext) {
      systemPrompt += `\n\nIMPORTANT INSTRUCTIONS:
- You have access to the user's transcript context from this day
- Answer questions ONLY based on the provided transcript context
- If the user asks about something not in the transcript, politely say you don't have that information in today's context
- Do NOT make up information or go outside the provided context
- You can summarize, analyze, and answer questions about the transcript content
- Be helpful and conversational while staying within the context boundaries

${result.transcriptContext}`;
    } else {
      systemPrompt += `\n\nNote: No transcript context is available for this chatroom. You can have a general conversation with the user.`;
    }

    // If a message is provided, generate AI response
    let aiResponse = null;
    if (message) {
      const { geminiService } = await import('../services/gemini.service');
      
      // Get conversation history
      const conversationHistory = await chatroomService.getConversationHistory(id as string, 10);
      
      // Add system prompt as first message
      const fullHistory = [
        { role: 'user', content: systemPrompt },
        { role: 'assistant', content: 'I understand. I will answer based only on the provided transcript context.' },
        ...conversationHistory,
      ];

      aiResponse = await geminiService.generateResponse(message, fullHistory);

      // Save user message
      await chatroomService.createUserMessage(id as string, message, userId);

      // Save AI response
      await chatroomService.createAIMessage(id as string, aiResponse);
    }

    sendSuccessResponse(
      res,
      200,
      successMessages.FETCHED('Chatroom'),
      {
        chatroom: {
          id: result.chatroom._id,
          name: result.chatroom.name,
          description: result.chatroom.description,
          date: result.chatroom.date,
          isActive: result.chatroom.isActive,
          stats: result.chatroom.stats,
        },
        messages: result.messages.map(msg => ({
          id: msg._id,
          content: msg.content,
          messageType: msg.messageType,
          userId: msg.userId,
          createdAt: msg.createdAt,
        })),
        transcripts: result.transcripts,
        context: {
          hasContext: result.contextSummary.hasContext,
          totalChunks: result.contextSummary.totalChunks,
          totalWords: result.contextSummary.totalWords,
          timeRange: result.contextSummary.timeRange,
        },
        systemPrompt: result.transcriptContext ? 'Context-aware mode: AI will answer based on transcript context only' : 'General conversation mode',
        aiResponse,
      }
    );
  }
);
