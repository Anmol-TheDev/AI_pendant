import mongoose from 'mongoose';
import { TranscriptChatroom } from '../src/models/TranscriptChatroom';
import { TranscriptChunk } from '../src/models/TranscriptChunk';
import { appConfig } from '../src/config';

async function checkChatrooms() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(appConfig.mongo.uri);
    console.log('✅ Connected to MongoDB\n');

    // Check chatrooms
    const chatrooms = await TranscriptChatroom.find({}).lean();
    console.log(`📁 Total Chatrooms: ${chatrooms.length}`);
    
    if (chatrooms.length > 0) {
      console.log('\nChatrooms:');
      chatrooms.forEach((room) => {
        console.log(`  - ${room.name} (Day ${room.dayNumber})`);
        console.log(`    ID: ${room._id}`);
        console.log(`    Start: ${room.startTime}`);
        console.log(`    End: ${room.endTime}`);
        console.log(`    User: ${room.userId}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No chatrooms found in database');
    }

    // Check chunks
    const chunks = await TranscriptChunk.find({}).lean();
    console.log(`📝 Total Transcript Chunks: ${chunks.length}`);
    
    if (chunks.length > 0) {
      console.log('\nRecent Chunks:');
      chunks.slice(-5).forEach((chunk) => {
        console.log(`  - Chunk ${chunk.chunkNumber || 'N/A'}: "${chunk.text.substring(0, 50)}..."`);
        console.log(`    Chatroom ID: ${chunk.chatroomId}`);
        console.log(`    Timestamp: ${chunk.timestamp}`);
        console.log('');
      });
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkChatrooms();
