import { geminiService } from './gemini.service';
import { logger } from '../utils';
import type { SentimentType } from '../models/TranscriptChunk';

/**
 * Lightweight NLP service for sentiment and topic extraction
 * Uses Gemini for analysis
 */

interface NLPAnalysis {
  sentiment: SentimentType;
  topics: string[];
}

// Simple keyword-based sentiment (fallback)
const POSITIVE_WORDS = ['happy', 'great', 'good', 'love', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'nice'];
const NEGATIVE_WORDS = ['bad', 'sad', 'hate', 'terrible', 'awful', 'horrible', 'angry', 'frustrated', 'annoyed', 'disappointed'];

/**
 * Quick sentiment analysis using keyword matching (fast fallback)
 */
function quickSentiment(text: string): SentimentType {
  const lower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of POSITIVE_WORDS) {
    if (lower.includes(word)) positiveCount++;
  }
  for (const word of NEGATIVE_WORDS) {
    if (lower.includes(word)) negativeCount++;
  }

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

/**
 * Extract topics using Gemini (or fallback to simple extraction)
 */
async function extractTopicsWithLLM(text: string): Promise<string[]> {
  try {
    const prompt = `Extract 1-5 main topics from this transcript text. Return ONLY a JSON array of topic strings, nothing else.
Text: "${text}"
Example output: ["work", "meeting", "project deadline"]`;

    const response = await geminiService.generateResponse(prompt);
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const topics = JSON.parse(cleaned);
    return Array.isArray(topics) ? topics.slice(0, 5) : [];
  } catch (error) {
    logger.warn('LLM topic extraction failed, using fallback', { error });
    return extractTopicsFallback(text);
  }
}

/**
 * Simple topic extraction fallback (noun-like words)
 */
function extractTopicsFallback(text: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'after', 'before', 'when', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am']);
  
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordFreq = new Map<string, number>();
  
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }
  
  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);
}

/**
 * Analyze text for sentiment and topics
 */
export async function analyzeText(text: string, useLLM = true): Promise<NLPAnalysis> {
  const sentiment = quickSentiment(text);
  const topics = useLLM ? await extractTopicsWithLLM(text) : extractTopicsFallback(text);
  
  return { sentiment, topics };
}

/**
 * Batch analyze multiple texts
 */
export async function batchAnalyze(texts: string[]): Promise<NLPAnalysis[]> {
  return Promise.all(texts.map(text => analyzeText(text, false)));
}
