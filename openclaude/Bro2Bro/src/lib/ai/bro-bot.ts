/**
 * Bro Bot - AI-powered automated bro sender
 *
 * This module provides AI-generated bros for inactive users
 * to keep them engaged and help maintain streaks.
 */

import { BroType, BroBotType, BroBotMessage } from '@/types';
import prisma from '../db';

interface BroBotConfig {
  enabled: boolean;
  type: BroBotType;
  frequency: 'low' | 'medium' | 'high';
  personality: string;
}

const DEFAULT_CONFIG: BroBotConfig = {
  enabled: false,
  type: 'MOTIVATIONAL',
  frequency: 'medium',
  personality: 'friendly',
};

const FREQUENCY_MINUTES = {
  low: 1440,    // Once per day
  medium: 480,  // Every 8 hours
  high: 180,    // Every 3 hours
};

// Pre-written bro prompts for each type (fallback when AI is unavailable)
const BRO_PROMPTS: Record<BroBotType, Record<BroType, string[]>> = {
  FUNNY: {
    AGGRESSIVE: [
      "What's up bro, still sleeping? WAKE UP!",
      "Bro, you're missing out on all the action!",
      "Get over here bro, this is URGENT!",
    ],
    FUNNY: [
      "Hey bro, did you hear the one about the guy who forgot to check Bro2Bro? He missed everything!",
      "Bro, if you were any more absent, you'd be a ghost!",
      "Just checking if you're still alive bro!",
    ],
    COLD: [
      "...bro?",
      "Not cool bro, you've been gone forever.",
      "Brr... it's cold without you here bro.",
    ],
    HEARTBREAK: [
      "My heart aches for your return, bro.",
      "Missing you more than words can say, bro.",
      "The app feels empty without you, bro.",
    ],
    RESPECT: [
      "Much respect bro, but where you at?",
      "You've earned a break bro, come back when ready.",
      "Respect the hustle bro. Don't forget about us!",
    ],
  },
  MOTIVATIONAL: {
    AGGRESSIVE: [
      "RISE AND GRIND BRO! Your streak needs you!",
      "GET UP AND SEND THAT BRO! Don't let the streak die!",
      "CHAMPIONS NEVER QUIT BRO! Keep the streak alive!",
    ],
    FUNNY: [
      "You've got this bro! One bro a day keeps the sadness away!",
      "Believe in yourself bro! You're the Bro-iest!",
      "Time to shine bro! Let's keep this streak going!",
    ],
    COLD: [
      "Stay cool bro, but don't freeze out your streaks.",
      "Chill out bro, but don't forget to bro.",
      "Keep your cool bro, but keep the streak warm.",
    ],
    HEARTBREAK: [
      "Every ending is a new beginning, bro. Let's start fresh!",
      "Don't let a broken streak break your spirit, bro.",
      "Your bros miss you. Come back and make a new memory.",
    ],
    RESPECT: [
      "You earned that streak bro. Now protect it!",
      "Respect the grind bro. One more day!",
      "Be the bro you want to see in the world!",
    ],
  },
  RANDOM: {
    AGGRESSIVE: [
      "BRO! NOW!",
      "DON'T MAKE ME COME GET YOU, BRO!",
      "URGENT BRO ALERT!",
    ],
    FUNNY: [
      "Bro... are you a wizard? Because you've disappeared!",
      "If bros were currency, you'd be broke right now!",
      "Knock knock... who's there? BRO! BRO WHO? BRO YOU MISSING IN ACTION!",
    ],
    COLD: [
      "The North remembers, bro. Do you?",
      "Winter is coming, bro. But the streak is ice cold.",
      "Ice bro, ice bro, baby.",
    ],
    HEARTBREAK: [
      "Why bro? Why did you leave us?",
      "I thought what we had was special, bro.",
      "Come back to us, bro. We need you.",
    ],
    RESPECT: [
      "Real recognizes real, bro. You're real, right?",
      "Legends never die, bro. Your streak might though.",
      "To bro or not to bro, that is the question.",
    ],
  },
};

/**
 * Check if a user needs a bro bot message
 */
export async function checkAndSendBroBot(userId: string): Promise<BroBotMessage | null> {
  // Get user settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      lastActiveAt: true,
      onboardingCompleted: true,
    },
  });

  if (!user || !user.onboardingCompleted) {
    return null;
  }

  // Check if enough time has passed since last activity
  const lastActive = new Date(user.lastActiveAt);
  const hoursSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60);

  // Only send if inactive for more than 12 hours
  if (hoursSinceActive < 12) {
    return null;
  }

  // Get user's bro bot config (stored in settings/preferences)
  // For now, use default config
  const config = DEFAULT_CONFIG;

  if (!config.enabled) {
    return null;
  }

  // Check if we've sent a bot message recently
  const recentBotBro = await prisma.bro.findFirst({
    where: {
      receiverId: userId,
      senderId: 'BRO_BOT',
      createdAt: {
        gte: new Date(Date.now() - FREQUENCY_MINUTES[config.frequency] * 60 * 1000),
      },
    },
  });

  if (recentBotBro) {
    return null;
  }

  // Generate the bro bot message
  const message = generateBroBotMessage(config);

  return message;
}

/**
 * Generate a bro bot message
 */
function generateBroBotMessage(config: BroBotConfig): BroBotMessage {
  // Determine best bro type based on user context
  // (This would be more sophisticated in production, using ML)
  const broTypes: BroType[] = ['RESPECT', 'FUNNY', 'MOTIVATIONAL', 'COLD', 'HEARTBREAK'];
  const selectedType = broTypes[Math.floor(Math.random() * broTypes.length)];

  // Get prompts for this type
  const prompts = BRO_PROMPTS[config.type][selectedType];
  const prompt = prompts[Math.floor(Math.random() * prompts.length)];

  // Try to enhance with OpenAI if available
  if (process.env.OPENAI_API_KEY) {
    // In production, this would call the OpenAI API
    // For now, we use the pre-written prompts
  }

  return {
    id: `bro-bot-${Date.now()}`,
    type: config.type,
    message: prompt,
    broType: selectedType,
    generatedAt: new Date(),
  };
}

/**
 * Send a bro bot message to a user
 */
export async function sendBroBotMessage(
  userId: string,
  message: BroBotMessage
): Promise<void> {
  await prisma.bro.create({
    data: {
      senderId: 'BRO_BOT', // Special system user ID
      receiverId: userId,
      type: message.broType,
      message: message.message,
      isAnonymous: false,
      status: 'PENDING',
      reactionCount: 0,
      engagementScore: 0,
    },
  });

  // Create notification
  // In production, this would emit via socket
  console.log(`Bro Bot sent ${message.broType} bro to user ${userId}`);
}

/**
 * Process all users who need bro bot messages
 * Run this periodically (e.g., every hour)
 */
export async function processBroBotQueue(): Promise<number> {
  // Get users who haven't been active recently
  const inactiveUsers = await prisma.user.findMany({
    where: {
      lastActiveAt: {
        lt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      onboardingCompleted: true,
    },
    select: {
      id: true,
    },
    take: 100, // Process in batches
  });

  let sentCount = 0;

  for (const user of inactiveUsers) {
    const message = await checkAndSendBroBot(user.id);
    if (message) {
      await sendBroBotMessage(user.id, message);
      sentCount++;
    }
  }

  return sentCount;
}

/**
 * Get Bro Bot settings for a user
 */
export async function getBroBotSettings(userId: string): Promise<BroBotConfig> {
  // In production, fetch from user preferences/database
  return DEFAULT_CONFIG;
}

/**
 * Update Bro Bot settings for a user
 */
export async function updateBroBotSettings(
  userId: string,
  settings: Partial<BroBotConfig>
): Promise<BroBotConfig> {
  // In production, save to user preferences/database
  return { ...DEFAULT_CONFIG, ...settings };
}

/**
 * ML-based bro generation (Advanced)
 *
 * For production, this would use a fine-tuned language model
 * to generate personalized, context-aware bro messages.
 */
async function generateMLBroMessage(
  userContext: unknown,
  recipientContext: unknown,
  relationshipHistory: unknown
): Promise<string> {
  // This would call an ML model API
  // Example prompt:
  // "Generate a friendly bro message from {user} to {recipient} based on
  // their {relationshipHistory}. The tone should be {desiredTone}."

  // For now, return a placeholder
  return "Hey bro, thinking of you!";
}

export default {
  checkAndSendBroBot,
  processBroBotQueue,
  getBroBotSettings,
  updateBroBotSettings,
};
