import mongoose from 'mongoose';
import { TranscriptChatroom } from '../src/models/TranscriptChatroom';
import { appConfig } from '../src/config';

/**
 * Cleanup script to remove invalid chatrooms with NaN dayNumber
 */
async function cleanupInvalidChatrooms() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(appConfig.mongo.uri);
    console.log('✅ Connected to MongoDB');

    // Find chatrooms with invalid dayNumber
    const invalidChatrooms = await TranscriptChatroom.find({
      $or: [
        { dayNumber: { $type: 'string' } },
        { dayNumber: null },
        { dayNumber: { $exists: false } },
      ],
    });

    console.log(`Found ${invalidChatrooms.length} invalid chatrooms`);

    if (invalidChatrooms.length > 0) {
      for (const chatroom of invalidChatrooms) {
        console.log(`Deleting invalid chatroom: ${chatroom._id} (dayNumber: ${chatroom.dayNumber})`);
      }

      const result = await TranscriptChatroom.deleteMany({
        _id: { $in: invalidChatrooms.map(c => c._id) },
      });

      console.log(`✅ Deleted ${result.deletedCount} invalid chatrooms`);
    } else {
      console.log('✅ No invalid chatrooms found');
    }

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupInvalidChatrooms();
