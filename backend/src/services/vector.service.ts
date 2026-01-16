import { logger } from '../utils';
import { appConfig } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Vector DB Service
 * Abstracts vector storage operations
 * Currently uses in-memory store with Gemini embeddings
 * Can be swapped for Chroma/Pinecone/Weaviate
 */

interface VectorMetadata {
  userId: string;
  chatroomId: string;
  segmentId: string;
  date: string;
  hour: number;
  sentiment: string;
  topics: string[];
}

interface VectorRecord {
  id: string;
  vector: number[];
  metadata: VectorMetadata;
  text: string;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
  text: string;
}

// In-memory vector store (replace with actual vector DB in production)
const vectorStore: Map<string, VectorRecord> = new Map();

/**
 * Generate embedding using Gemini
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Using Gemini's embedding model
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(appConfig.gemini.apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    logger.error('Embedding generation failed', { error });
    // Return a simple hash-based vector as fallback (768 dimensions)
    return generateFallbackEmbedding(text);
  }
}

/**
 * Fallback embedding using simple text hashing
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
  
  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map(v => v / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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

/**
 * Store a vector with metadata
 */
export async function storeVector(
  text: string,
  metadata: VectorMetadata
): Promise<string> {
  const id = uuidv4();
  const vector = await generateEmbedding(text);
  
  vectorStore.set(id, { id, vector, metadata, text });
  logger.debug('Vector stored', { id, userId: metadata.userId });
  
  return id;
}

/**
 * Search vectors by semantic similarity
 */
export async function searchVectors(
  query: string,
  filters?: Partial<VectorMetadata>,
  limit = 10
): Promise<SearchResult[]> {
  const queryVector = await generateEmbedding(query);
  const results: SearchResult[] = [];
  
  for (const record of vectorStore.values()) {
    // Apply filters
    if (filters) {
      if (filters.userId && record.metadata.userId !== filters.userId) continue;
      if (filters.date && record.metadata.date !== filters.date) continue;
      if (filters.hour !== undefined && record.metadata.hour !== filters.hour) continue;
      if (filters.chatroomId && record.metadata.chatroomId !== filters.chatroomId) continue;
      if (filters.sentiment && record.metadata.sentiment !== filters.sentiment) continue;
    }
    
    const score = cosineSimilarity(queryVector, record.vector);
    results.push({
      id: record.id,
      score,
      metadata: record.metadata,
      text: record.text,
    });
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Find similar vectors to a given embedding ID
 */
export async function findSimilar(
  embeddingId: string,
  filters?: Partial<VectorMetadata>,
  limit = 10
): Promise<SearchResult[]> {
  const sourceRecord = vectorStore.get(embeddingId);
  if (!sourceRecord) {
    logger.warn('Source embedding not found', { embeddingId });
    return [];
  }
  
  const results: SearchResult[] = [];
  
  for (const record of vectorStore.values()) {
    if (record.id === embeddingId) continue;
    
    // Apply filters
    if (filters) {
      if (filters.userId && record.metadata.userId !== filters.userId) continue;
      if (filters.date && record.metadata.date !== filters.date) continue;
    }
    
    const score = cosineSimilarity(sourceRecord.vector, record.vector);
    results.push({
      id: record.id,
      score,
      metadata: record.metadata,
      text: record.text,
    });
  }
  
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Delete a vector by ID
 */
export function deleteVector(id: string): boolean {
  return vectorStore.delete(id);
}

/**
 * Get vector store stats
 */
export function getStats(): { totalVectors: number } {
  return { totalVectors: vectorStore.size };
}
