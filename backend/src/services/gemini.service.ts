import { GoogleGenerativeAI } from '@google/generative-ai';
import { appConfig } from '../config';
import { logger } from '../utils';

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!appConfig.gemini.apiKey) {
      logger.error('Gemini API key is not configured');
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(appConfig.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Generate AI response for a user message
   */
  async generateResponse(
    userMessage: string,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<string> {
    try {
      logger.info('Generating AI response', { messageLength: userMessage.length });

      // If conversation history exists, use chat mode
      if (conversationHistory && conversationHistory.length > 0) {
        const chat = this.model.startChat({
          history: conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response.text();
        
        logger.info('AI response generated successfully', { 
          responseLength: response.length 
        });
        
        return response;
      }

      // Single message mode
      const result = await this.model.generateContent(userMessage);
      const response = result.response.text();
      
      logger.info('AI response generated successfully', { 
        responseLength: response.length 
      });
      
      return response;
    } catch (error) {
      logger.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate streaming response (for real-time chat)
   */
  async *generateStreamingResponse(
    userMessage: string,
    conversationHistory?: { role: string; content: string }[]
  ): AsyncGenerator<string, void, unknown> {
    try {
      logger.info('Generating streaming AI response');

      let result;
      if (conversationHistory && conversationHistory.length > 0) {
        const chat = this.model.startChat({
          history: conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          })),
        });
        result = await chat.sendMessageStream(userMessage);
      } else {
        result = await this.model.generateContentStream(userMessage);
      }

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        yield chunkText;
      }

      logger.info('Streaming AI response completed');
    } catch (error) {
      logger.error('Error generating streaming AI response:', error);
      throw new Error('Failed to generate streaming AI response');
    }
  }
}

export const geminiService = new GeminiService();
