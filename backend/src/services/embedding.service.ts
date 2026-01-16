import { GoogleGenerativeAI } from '@google/generative-ai';
import { appConfig } from '../config';
import { logger } from '../utils';

/**
 * Embedding Service
 * Generates vector embeddings for text using Gemini
 * Can be swapped for OpenAI, BGE, E5, or other models
 */

let genAI: GoogleGenerativeAI | null = null;
let embeddingModel: any = null;

/**
 * Initialize embedding model
 */
export function initializeEmbeddingModel(): void {
  if (!appConfig.gemini.apiKey) {
    logger.warn('Gemini API key not configured. Embeddings will use fallback.');
    return;
  }

  genAI = new GoogleGenerativeAI(appConfig.gemini.apiKey);
  embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  logger.info('Embedding model initialized (Gemini text-embedding-004)');
}

/**
 * Generate embedding vector for text
 * Returns 768-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (!embeddingModel) {
      logger.warn('Embedding model not initialized, using fallback');
      return generateFallbackEmbedding(text);
    }

    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    logger.error('Embedding generation failed, using fallback', { error });
    return generateFallbackEmbedding(text);
  }
}

/**
 * Batch generate embeddings for multiple texts
 * More efficient than individual calls
 */
export async function batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
  }
  
  return embeddings;
}

/**
 * Fallback embedding using simple text hashing
 * Used when API is unavailable or for testing
 * Returns 768-dimensional vector
 */
function generateFallbackEmbedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let j = 0; j < word.length; j++) {
      const idx = (word.charCodeAt(j) * (i + 1) * (j + 1)) % 768;
      vector[idx] += 1 / (words.length * word.length);
    }
  }
  
  // Normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}
