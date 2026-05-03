import prisma from '../db';
import { BroType, PersonalityProfile } from '@/types';

/**
 * Update personality profile based on user activity
 */
export async function updatePersonalityProfile(
  userId: string,
  action: 'BRO_SENT' | 'BRO_RECEIVED' | 'REACTION_SENT',
  broType?: BroType
) {
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  // Update bro type counts
  if (broType && action === 'BRO_SENT') {
    switch (broType) {
      case 'AGGRESSIVE':
        updateData.aggressiveCount = { increment: 1 };
        break;
      case 'FUNNY':
        updateData.funnyCount = { increment: 1 };
        break;
      case 'COLD':
        updateData.coldCount = { increment: 1 };
        break;
      case 'HEARTBREAK':
        updateData.heartbreakCount = { increment: 1 };
        break;
      case 'RESPECT':
        updateData.respectCount = { increment: 1 };
        break;
    }
  }

  // Update response stats
  if (action === 'REACTION_SENT') {
    updateData.totalResponses = { increment: 1 };
  }

  await prisma.personalityProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...(broType && {
        preferredBroType: broType,
        [`${broType.toLowerCase()}Count`]: 1,
      }),
      totalResponses: action === 'REACTION_SENT' ? 1 : 0,
    },
    update: updateData,
  });
}

/**
 * Calculate and update preferred bro type
 */
export async function calculatePreferredBroType(userId: string): Promise<BroType | null> {
  const profile = await prisma.personalityProfile.findUnique({
    where: { userId },
  });

  if (!profile) return null;

  const counts = {
    AGGRESSIVE: profile.aggressiveCount,
    FUNNY: profile.funnyCount,
    COLD: profile.coldCount,
    HEARTBREAK: profile.heartbreakCount,
    RESPECT: profile.respectCount,
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const preferred = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as BroType;

  await prisma.personalityProfile.update({
    where: { userId },
    data: { preferredBroType: preferred },
  });

  return preferred;
}

/**
 * Calculate average response time for a user
 */
export async function calculateResponseTime(userId: string) {
  // Get bros received and when they were reacted to
  const reactions = await prisma.reaction.findMany({
    where: { userId },
    include: {
      bro: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  if (reactions.length === 0) return null;

  const responseTimes = reactions.map(r =>
    (new Date(r.createdAt).getTime() - new Date(r.bro.createdAt).getTime()) / (1000 * 60)
  );

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  await prisma.personalityProfile.update({
    where: { userId },
    data: { avgResponseTimeMinutes: Math.round(avgResponseTime) },
  });

  return avgResponseTime;
}

/**
 * Calculate engagement rate for a user
 */
export async function calculateEngagementRate(userId: string) {
  const [sent, received, reactionsReceived] = await Promise.all([
    prisma.bro.count({ where: { senderId: userId } }),
    prisma.bro.count({ where: { receiverId: userId } }),
    prisma.reaction.count({
      where: {
        bro: {
          senderId: userId,
        },
      },
    }),
  ]);

  if (sent + received === 0) return 0;

  // Engagement rate = reactions received / bros sent
  const engagementRate = sent > 0 ? reactionsReceived / sent : 0;

  await prisma.personalityProfile.update({
    where: { userId },
    data: { engagementRate },
  });

  return engagementRate;
}

/**
 * Get complete personality analysis for a user
 */
export async function getPersonalityAnalysis(userId: string): Promise<Partial<PersonalityProfile> & { traits: string[] }> {
  const profile = await prisma.personalityProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return {
      traits: ['New to Bro2Bro'],
    };
  }

  const traits: string[] = [];

  // Determine bro type preference
  const counts = {
    'Aggressive Bro': profile.aggressiveCount,
    'Funny Bro': profile.funnyCount,
    'Cold Bro': profile.coldCount,
    'Heartbreak Bro': profile.heartbreakCount,
    'Respect Bro': profile.respectCount,
  };

  const topType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  if (topType[1] > 0) {
    traits.push(`Prefers ${topType[0]}`);
  }

  // Response speed
  if (profile.avgResponseTimeMinutes !== null) {
    if (profile.avgResponseTimeMinutes < 30) {
      traits.push('Quick Responder');
    } else if (profile.avgResponseTimeMinutes > 120) {
      traits.push('Thoughtful Responder');
    }
  }

  // Engagement
  if (profile.engagementRate > 0.8) {
    traits.push('Highly Engaged');
  }

  // Activity level
  const totalBros = Object.values(counts).reduce((a, b) => a + b, 0);
  if (totalBros > 50) {
    traits.push('Power User');
  } else if (totalBros > 20) {
    traits.push('Active User');
  }

  return { ...profile, traits };
}
