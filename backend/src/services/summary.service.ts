import { geminiService } from './gemini.service';
import { getDailyContext } from './context.service';
import { TranscriptChatroom } from '../models/TranscriptChatroom';
import { logger } from '../utils';

/**
 * Summary Service
 * Generates daily and weekly summaries using LLM
 */

interface DailySummary {
  chatroomName: string;
  dayNumber: number;
  startTime: Date;
  endTime: Date;
  summary: string;
  highlights: string[];
  topTopics: string[];
  sentiment: string;
  wordCount: number;
}

interface WeeklySummary {
  startDayNumber: number;
  endDayNumber: number;
  summary: string;
  dailySummaries: DailySummary[];
  trends: string[];
  topTopics: string[];
}

/**
 * Generate daily summary from transcript chunks
 */
export async function generateDailySummary(userId: string, dayNumber: number): Promise<DailySummary | null> {
  const context = await getDailyContext(userId, dayNumber);
  if (!context || context.totalChunks === 0) {
    return null;
  }

  // Compile all text for the day
  const allText = context.segments
    .flatMap(s => s.chunks.map(c => c.text))
    .join('\n');

  // Collect all topics
  const topicCounts = new Map<string, number>();
  for (const segment of context.segments) {
    for (const chunk of segment.chunks) {
      for (const topic of chunk.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }
  }
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  // Calculate overall sentiment
  let positive = 0, neutral = 0, negative = 0;
  for (const segment of context.segments) {
    positive += segment.stats.sentiment.positive || 0;
    neutral += segment.stats.sentiment.neutral || 0;
    negative += segment.stats.sentiment.negative || 0;
  }
  const overallSentiment = positive > negative ? 'positive' : negative > positive ? 'negative' : 'neutral';

  // Generate summary using LLM
  const prompt = `Summarize this day's transcript in 2-3 paragraphs. Include key activities, conversations, and notable moments.

Transcript:
${allText.slice(0, 8000)}

Provide:
1. A concise summary (2-3 paragraphs)
2. 3-5 key highlights as bullet points

Format as JSON:
{"summary": "...", "highlights": ["...", "..."]}`;

  try {
    const response = await geminiService.generateResponse(prompt);
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      chatroomName: context.chatroomName,
      dayNumber: context.dayNumber,
      startTime: context.startTime,
      endTime: context.endTime,
      summary: parsed.summary || 'Summary unavailable',
      highlights: parsed.highlights || [],
      topTopics,
      sentiment: overallSentiment,
      wordCount: context.totalWords,
    };
  } catch (error) {
    logger.error('Failed to generate daily summary', { error, dayNumber });
    
    // Fallback summary
    return {
      chatroomName: context.chatroomName,
      dayNumber: context.dayNumber,
      startTime: context.startTime,
      endTime: context.endTime,
      summary: `Day contained ${context.totalChunks} transcript segments across ${context.segments.length} hours with ${context.totalWords} words.`,
      highlights: topTopics.map(t => `Discussed: ${t}`),
      topTopics,
      sentiment: overallSentiment,
      wordCount: context.totalWords,
    };
  }
}

/**
 * Generate weekly summary from daily summaries
 * Now works with a range of day numbers (e.g., days 1-7)
 */
export async function generateWeeklySummary(
  userId: string,
  startDayNumber: number,
  endDayNumber: number
): Promise<WeeklySummary | null> {
  // Get all chatrooms for the range
  const chatrooms = await TranscriptChatroom.find({
    userId,
    dayNumber: { $gte: startDayNumber, $lte: endDayNumber },
  }).sort({ dayNumber: 1 });

  if (chatrooms.length === 0) {
    return null;
  }

  // Generate daily summaries
  const dailySummaries: DailySummary[] = [];
  for (const chatroom of chatrooms) {
    const summary = await generateDailySummary(userId, chatroom.dayNumber);
    if (summary) {
      dailySummaries.push(summary);
    }
  }

  if (dailySummaries.length === 0) {
    return null;
  }

  // Aggregate topics
  const topicCounts = new Map<string, number>();
  for (const daily of dailySummaries) {
    for (const topic of daily.topTopics) {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
  }
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);

  // Generate weekly summary using LLM
  const dailyTexts = dailySummaries.map(d => `${d.chatroomName}: ${d.summary}`).join('\n\n');
  
  const prompt = `Create a weekly summary from these daily summaries. Identify trends and patterns.

Daily Summaries:
${dailyTexts}

Provide:
1. A cohesive weekly summary (2-3 paragraphs)
2. 3-5 notable trends or patterns

Format as JSON:
{"summary": "...", "trends": ["...", "..."]}`;

  try {
    const response = await geminiService.generateResponse(prompt);
    const cleaned = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      startDayNumber,
      endDayNumber,
      summary: parsed.summary || 'Weekly summary unavailable',
      dailySummaries,
      trends: parsed.trends || [],
      topTopics,
    };
  } catch (error) {
    logger.error('Failed to generate weekly summary', { error });
    
    return {
      startDayNumber,
      endDayNumber,
      summary: `Week contained ${dailySummaries.length} days of transcripts.`,
      dailySummaries,
      trends: [],
      topTopics,
    };
  }
}
