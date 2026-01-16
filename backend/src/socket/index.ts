import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils';
import * as chatroomService from '../services/chatroom.service';
import { geminiService } from '../services/gemini.service';

/**
 * Socket.IO Server Setup
 * Handles real-time chat with AI integration
 */

export const initializeSocketIO = (httpServer: HTTPServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: false,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Connection handler (no authentication required)
  io.on('connection', async (socket: Socket) => {
    logger.info('Client connected', { 
      socketId: socket.id
    });

    // Join today's chatroom
    try {
      const chatroom = await chatroomService.getTodayChatroom();
      const chatroomId = chatroom._id.toString();
      
      socket.join(chatroomId);

      // Send chatroom info and recent messages (paginated)
      const result = await chatroomService.getPaginatedMessages(chatroomId, 50);
      
      socket.emit('chatroom:joined', {
        chatroom: {
          id: chatroom._id,
          name: chatroom.name,
          date: chatroom.date,
          stats: chatroom.stats,
        },
        messages: result.messages.map(msg => ({
          id: msg._id,
          content: msg.content,
          messageType: msg.messageType,
          userId: msg.userId,
          user: msg.userId ? {
            id: (msg.userId as any)._id,
            username: (msg.userId as any).username || 'Anonymous',
            firstName: (msg.userId as any).firstName,
            lastName: (msg.userId as any).lastName,
            imageUrl: (msg.userId as any).imageUrl,
          } : null,
          createdAt: msg.createdAt,
        })),
        pagination: {
          hasMore: result.hasMore,
          nextCursor: result.nextCursor,
          totalCount: result.totalCount,
        },
      });

      logger.info('User joined chatroom', { 
        socketId: socket.id,
        chatroomId 
      });
    } catch (error) {
      logger.error('Error joining chatroom:', error);
      socket.emit('error', { message: 'Failed to join chatroom' });
    }

    // Handle user message
    socket.on('message:send', async (data: { content: string; username?: string }) => {
      try {
        const { content, username } = data;

        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        // Get current chatroom
        const chatroom = await chatroomService.getTodayChatroom();
        const chatroomId = chatroom._id.toString();

        // Save user message (no userId required)
        const userMessage = await chatroomService.createUserMessage(
          chatroomId,
          content.trim()
        );

        // Broadcast user message to all clients in the room
        io.to(chatroomId).emit('message:received', {
          id: userMessage._id,
          content: userMessage.content,
          messageType: 'user',
          userId: null,
          user: username ? {
            username: username,
          } : null,
          createdAt: userMessage.createdAt,
        });

        logger.info('User message sent', { 
          messageId: userMessage._id,
          socketId: socket.id
        });

        // Generate AI response
        try {
          // Get conversation history for context
          const conversationHistory = await chatroomService.getConversationHistory(
            chatroomId,
            10
          );

          // Emit typing indicator
          io.to(chatroomId).emit('ai:typing', { isTyping: true });

          // Generate AI response with streaming
          let aiResponseText = '';
          
          for await (const chunk of geminiService.generateStreamingResponse(
            content,
            conversationHistory
          )) {
            aiResponseText += chunk;
            
            // Emit streaming chunk to all clients
            io.to(chatroomId).emit('ai:streaming', { 
              chunk,
              isComplete: false 
            });
          }

          // Stop typing indicator
          io.to(chatroomId).emit('ai:typing', { isTyping: false });

          // Save AI message to database
          const aiMessage = await chatroomService.createAIMessage(
            chatroomId,
            aiResponseText
          );

          // Emit complete AI message
          io.to(chatroomId).emit('message:received', {
            id: aiMessage._id,
            content: aiMessage.content,
            messageType: 'system',
            userId: null,
            createdAt: aiMessage.createdAt,
          });

          // Emit streaming complete
          io.to(chatroomId).emit('ai:streaming', { 
            chunk: '',
            isComplete: true 
          });

          logger.info('AI response sent', { 
            messageId: aiMessage._id, 
            chatroomId 
          });
        } catch (aiError) {
          logger.error('Error generating AI response:', aiError);
          io.to(chatroomId).emit('ai:typing', { isTyping: false });
          io.to(chatroomId).emit('error', { 
            message: 'Failed to generate AI response' 
          });
        }
      } catch (error) {
        logger.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('Client disconnected', { 
        socketId: socket.id
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error:', error);
    });
  });

  logger.info('Socket.IO server initialized');
  return io;
};
