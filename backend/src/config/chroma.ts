import { ChromaClient, Collection } from 'chromadb';
import { appConfig } from './index';
import { logger } from '../utils';

/**
 * ChromaDB Client Configuration
 * Manages connection to ChromaDB vector database
 */

let chromaClient: ChromaClient | null = null;
let audioChunksCollection: Collection | null = null;

/**
 * Initialize ChromaDB client and collection
 */
export async function initializeChroma(): Promise<void> {
  try {
    logger.info('Connecting to ChromaDB...', { url: appConfig.chroma.url });

    chromaClient = new ChromaClient({
      path: appConfig.chroma.url,
    });

    // Test connection
    const heartbeat = await chromaClient.heartbeat();
    logger.info('ChromaDB heartbeat successful', { heartbeat });

    // Get or create collection
    audioChunksCollection = await chromaClient.getOrCreateCollection({
      name: appConfig.chroma.collection,
      metadata: {
        description: 'Audio transcript chunks with embeddings',
        'hnsw:space': 'cosine', // Use cosine similarity
      },
    });

    logger.info('✅ ChromaDB collection ready', {
      collection: appConfig.chroma.collection,
    });
  } catch (error) {
    logger.error('❌ Failed to initialize ChromaDB', { error });
    throw error;
  }
}

/**
 * Get ChromaDB client instance
 */
export function getChromaClient(): ChromaClient {
  if (!chromaClient) {
    throw new Error('ChromaDB client not initialized. Call initializeChroma() first.');
  }
  return chromaClient;
}

/**
 * Get audio chunks collection
 */
export function getAudioChunksCollection(): Collection {
  if (!audioChunksCollection) {
    throw new Error('ChromaDB collection not initialized. Start ChromaDB with: docker-compose up chroma -d');
  }
  return audioChunksCollection;
}

/**
 * Check if ChromaDB is available
 */
export function isChromaAvailable(): boolean {
  return chromaClient !== null && audioChunksCollection !== null;
}

/**
 * Close ChromaDB connection
 */
export async function closeChroma(): Promise<void> {
  if (chromaClient) {
    logger.info('Closing ChromaDB connection...');
    chromaClient = null;
    audioChunksCollection = null;
  }
}
