import { getAudioChunksCollection } from '../config/chroma';
import { generateEmbedding } from './embedding.service';
import { logger } from '../utils';

/**
 * ChromaDB Service
 * Handles all vector database operations for transcript chunks
 */

export interface ChromaMetadata {
  userId: string;
  chatroomId: string;
  chatroomName: string;
  dayNumber: string;
  segmentId: string;
  date: string;
  hour: number;
  sentiment: string;
  topics: string;
  timestamp: string;
  [key: string]: string | number;
}

export interface SearchResult {
  id: string;
  text: string;
  score: number;
  metadata: ChromaMetadata;
}

/**
 * Add a transcript chunk to ChromaDB
 */
export async function addChunk(
  id: string,
  text: string,
  metadata: {
    userId: string;
    chatroomId: string;
    chatroomName: string;
    dayNumber: string;
    segmentId: string;
    date: string;
    hour: number;
    sentiment: string;
    topics: string[];
    timestamp: string;
  }
): Promise<void> {
  try {
    const collection = getAudioChunksCollection();
    const embedding = await generateEmbedding(text);

    // Convert topics array to string for Chroma metadata
    const chromaMetadata: ChromaMetadata = {
      userId: metadata.userId,
      chatroomId: metadata.chatroomId,
      chatroomName: metadata.chatroomName,
      dayNumber: metadata.dayNumber,
      segmentId: metadata.segmentId,
      date: metadata.date,
      hour: metadata.hour,
      sentiment: metadata.sentiment,
      topics: metadata.topics.join(','),
      timestamp: metadata.timestamp,
    };

    await collection.add({
      ids: [id],
      embeddings: [embedding],
      documents: [text],
      metadatas: [chromaMetadata as any],
    });

    logger.debug('Chunk added to ChromaDB', { id, userId: metadata.userId });
  } catch (error) {
    logger.warn('Failed to add chunk to ChromaDB (ChromaDB may not be running)', { error: error instanceof Error ? error.message : String(error), id });
    // Don't throw - allow the app to continue without ChromaDB
  }
}

/**
 * Batch add multiple chunks (more efficient)
 */
export async function batchAddChunks(
  chunks: Array<{
    id: string;
    text: string;
    metadata: {
      userId: string;
      chatroomId: string;
      chatroomName: string;
      dayNumber: string;
      segmentId: string;
      date: string;
      hour: number;
      sentiment: string;
      topics: string[];
      timestamp: string;
    };
  }>
): Promise<void> {
  try {
    const collection = getAudioChunksCollection();
    
    const ids = chunks.map(c => c.id);
    const documents = chunks.map(c => c.text);
    const embeddings = await Promise.all(
      documents.map(text => generateEmbedding(text))
    );
    const metadatas = chunks.map(c => ({
      userId: c.metadata.userId,
      chatroomId: c.metadata.chatroomId,
      chatroomName: c.metadata.chatroomName,
      dayNumber: c.metadata.dayNumber,
      segmentId: c.metadata.segmentId,
      date: c.metadata.date,
      hour: c.metadata.hour,
      sentiment: c.metadata.sentiment,
      topics: c.metadata.topics.join(','),
      timestamp: c.metadata.timestamp,
    }));

    await collection.add({
      ids,
      embeddings,
      documents,
      metadatas: metadatas as any,
    });

    logger.info('Batch added chunks to ChromaDB', { count: chunks.length });
  } catch (error) {
    logger.error('Failed to batch add chunks to ChromaDB', { error });
    throw error;
  }
}

/**
 * Semantic search with optional metadata filters
 */
export async function semanticSearch(
  query: string,
  filters?: Partial<ChromaMetadata>,
  limit = 10
): Promise<SearchResult[]> {
  try {
    const collection = getAudioChunksCollection();
    const queryEmbedding = await generateEmbedding(query);

    // Build where clause for filtering
    const where: any = {};
    if (filters) {
      if (filters.userId) where.userId = filters.userId;
      if (filters.date) where.date = filters.date;
      if (filters.hour !== undefined) where.hour = filters.hour;
      if (filters.chatroomId) where.chatroomId = filters.chatroomId;
      if (filters.sentiment) where.sentiment = filters.sentiment;
    }

    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: limit,
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    // Transform results
    const searchResults: SearchResult[] = [];
    if (results.ids[0] && results.documents[0] && results.metadatas[0] && results.distances[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        const metadata = results.metadatas[0][i] as unknown as ChromaMetadata;
        searchResults.push({
          id: results.ids[0][i],
          text: results.documents[0][i] || '',
          score: 1 - (results.distances[0][i] || 0), // Convert distance to similarity
          metadata,
        });
      }
    }

    logger.debug('Semantic search completed', { query, resultsCount: searchResults.length });
    return searchResults;
  } catch (error) {
    logger.error('Semantic search failed', { error, query });
    throw error;
  }
}

/**
 * Find similar chunks to a given chunk ID
 */
export async function findSimilarChunks(
  chunkId: string,
  filters?: Partial<ChromaMetadata>,
  limit = 10
): Promise<SearchResult[]> {
  try {
    const collection = getAudioChunksCollection();

    // Get the source chunk
    const sourceChunk = await collection.get({
      ids: [chunkId],
      include: ['embeddings', 'documents', 'metadatas'],
    });

    if (!sourceChunk.embeddings || sourceChunk.embeddings.length === 0) {
      logger.warn('Source chunk not found in ChromaDB', { chunkId });
      return [];
    }

    const sourceEmbedding = sourceChunk.embeddings[0];

    // Build where clause
    const where: any = {};
    if (filters) {
      if (filters.userId) where.userId = filters.userId;
      if (filters.date) where.date = filters.date;
    }

    // Query for similar chunks
    const results = await collection.query({
      queryEmbeddings: [sourceEmbedding],
      nResults: limit + 1, // +1 because source will be included
      where: Object.keys(where).length > 0 ? where : undefined,
    });

    // Transform and filter out source chunk
    const searchResults: SearchResult[] = [];
    if (results.ids[0] && results.documents[0] && results.metadatas[0] && results.distances[0]) {
      for (let i = 0; i < results.ids[0].length; i++) {
        if (results.ids[0][i] === chunkId) continue; // Skip source chunk
        
        const metadata = results.metadatas[0][i] as unknown as ChromaMetadata;
        searchResults.push({
          id: results.ids[0][i],
          text: results.documents[0][i] || '',
          score: 1 - (results.distances[0][i] || 0),
          metadata,
        });
      }
    }

    return searchResults.slice(0, limit);
  } catch (error) {
    logger.error('Find similar chunks failed', { error, chunkId });
    throw error;
  }
}

/**
 * Delete a chunk from ChromaDB
 */
export async function deleteChunk(id: string): Promise<void> {
  try {
    const collection = getAudioChunksCollection();
    await collection.delete({ ids: [id] });
    logger.debug('Chunk deleted from ChromaDB', { id });
  } catch (error) {
    logger.error('Failed to delete chunk from ChromaDB', { error, id });
    throw error;
  }
}

/**
 * Get collection statistics
 */
export async function getCollectionStats(): Promise<{
  count: number;
  name: string;
}> {
  try {
    const collection = getAudioChunksCollection();
    const count = await collection.count();
    
    return {
      count,
      name: collection.name,
    };
  } catch (error) {
    logger.error('Failed to get collection stats', { error });
    throw error;
  }
}

/**
 * Clear all data from collection (use with caution!)
 */
export async function clearCollection(): Promise<void> {
  try {
    const collection = getAudioChunksCollection();
    // Get all IDs and delete them
    const allData = await collection.get();
    if (allData.ids.length > 0) {
      await collection.delete({ ids: allData.ids });
    }
    logger.warn('Collection cleared', { name: collection.name });
  } catch (error) {
    logger.error('Failed to clear collection', { error });
    throw error;
  }
}
