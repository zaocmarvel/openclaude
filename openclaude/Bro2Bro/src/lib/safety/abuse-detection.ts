import prisma from '../db';
import { addMinutes, addHours, subHours } from 'date-fns';

interface FlagResult {
  isFlagged: boolean;
  severity: number; // 1-5
  reason: string;
  expiresAt: Date;
}

/**
 * Detect and flag suspicious user activity
 */
export async function flagSuspiciousActivity(
  userId: string,
  activityType: string,
  metadata?: Record<string, unknown>
): Promise<FlagResult> {
  const now = new Date();

  switch (activityType) {
    case 'rapid_sending':
      return checkRapidSending(userId);
    case 'mass_bro_attack':
      return checkMassBroAttack(userId, metadata);
    case 'repeated_unwanted_bros':
      return checkRepeatedUnwantedBros(userId);
    case 'bot_behavior':
      return checkBotBehavior(userId);
    case 'location_anomaly':
      return checkLocationAnomaly(userId, metadata);
    default:
      return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
  }
}

/**
 * Check for rapid bro sending (spam)
 */
async function checkRapidSending(userId: string): Promise<FlagResult> {
  const now = new Date();
  const fiveMinutesAgo = addMinutes(now, -5);
  const oneHourAgo = addHours(now, -1);

  // Count bros sent in last 5 minutes
  const recentBros = await prisma.bro.count({
    where: {
      senderId: userId,
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
  });

  // Count bros sent in last hour
  const hourlyBros = await prisma.bro.count({
    where: {
      senderId: userId,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  // Flag if more than 10 bros in 5 minutes or 50 in 1 hour
  if (recentBros > 10 || hourlyBros > 50) {
    const severity = recentBros > 20 ? 5 : recentBros > 15 ? 4 : 3;
    const reason = `Excessive bro sending: ${recentBros} in 5 min, ${hourlyBros} in 1 hour`;

    await createSafetyFlag(userId, 'RAPID_SENDING', severity, reason, {
      recentBros,
      hourlyBros,
    });

    return {
      isFlagged: true,
      severity,
      reason,
      expiresAt: addHours(now, 24),
    };
  }

  return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
}

/**
 * Check for mass bro attacks (sending many bros to different users)
 */
async function checkMassBroAttack(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<FlagResult> {
  const now = new Date();
  const fiveMinutesAgo = addMinutes(now, -5);

  // Get unique receivers in last 5 minutes
  const recentBros = await prisma.bro.findMany({
    where: {
      senderId: userId,
      createdAt: {
        gte: fiveMinutesAgo,
      },
    },
    select: {
      receiverId: true,
    },
    distinct: ['receiverId'],
  });

  const uniqueReceivers = recentBros.length;

  // Flag if sending to more than 15 unique users in 5 minutes
  if (uniqueReceivers > 15) {
    const severity = uniqueReceivers > 30 ? 5 : uniqueReceivers > 20 ? 4 : 3;
    const reason = `Mass bro attack: ${uniqueReceivers} unique users in 5 minutes`;

    await createSafetyFlag(userId, 'MASS_BRO_ATTACK', severity, reason, {
      uniqueReceivers,
      ...metadata,
    });

    return {
      isFlagged: true,
      severity,
      reason,
      expiresAt: addHours(now, 24),
    };
  }

  return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
}

/**
 * Check for repeated unwanted bros (harassment pattern)
 */
async function checkRepeatedUnwantedBros(userId: string): Promise<FlagResult> {
  const now = new Date();
  const oneDayAgo = addHours(now, -24);

  // Find users who received bros but didn't react (indicating unwanted)
  const sentBros = await prisma.bro.findMany({
    where: {
      senderId: userId,
      createdAt: {
        gte: oneDayAgo,
      },
    },
    include: {
      reactions: true,
    },
  });

  // Group by receiver
  const receiverStats = new Map<string, { total: number; reacted: number }>();

  for (const bro of sentBros) {
    const stats = receiverStats.get(bro.receiverId) || { total: 0, reacted: 0 };
    stats.total++;
    if (bro.reactions.length > 0) {
      stats.reacted++;
    }
    receiverStats.set(bro.receiverId, stats);
  }

  // Find receivers with high unreacted bro ratio
  let flaggedReceivers = 0;
  for (const [, stats] of receiverStats) {
    const unreactedRatio = 1 - stats.reacted / stats.total;
    if (stats.total >= 5 && unreactedRatio > 0.8) {
      flaggedReceivers++;
    }
  }

  if (flaggedReceivers > 0) {
    const severity = flaggedReceivers > 3 ? 5 : flaggedReceivers > 1 ? 4 : 3;
    const reason = `Repeated unwanted bros to ${flaggedReceivers} users with low engagement`;

    await createSafetyFlag(userId, 'REPEATED_UNWANTED_BROS', severity, reason, {
      flaggedReceivers,
      totalSent: sentBros.length,
    });

    return {
      isFlagged: true,
      severity,
      reason,
      expiresAt: addHours(now, 48),
    };
  }

  return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
}

/**
 * Check for bot-like behavior patterns
 */
async function checkBotBehavior(userId: string): Promise<FlagResult> {
  const now = new Date();
  const oneHourAgo = addHours(now, -1);

  // Get user's interaction logs
  const logs = await prisma.interactionLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: oneHourAgo,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (logs.length < 10) {
    return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
  }

  // Check for consistent timing (bot signature)
  const intervals: number[] = [];
  for (let i = 1; i < logs.length; i++) {
    const interval =
      logs[i].createdAt.getTime() - logs[i - 1].createdAt.getTime();
    intervals.push(interval);
  }

  const avgInterval =
    intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) /
    intervals.length;
  const cv = Math.sqrt(variance) / avgInterval; // Coefficient of variation

  // Bots often have low variation in timing
  if (cv < 0.1 && intervals.length > 20) {
    const severity = cv < 0.05 ? 5 : 4;
    const reason = `Suspicious bot-like behavior detected: consistent action timing (${cv.toFixed(4)} CV)`;

    await createSafetyFlag(userId, 'BOT_BEHAVIOR', severity, reason, {
      actionCount: logs.length,
      timingCV: cv,
    });

    return {
      isFlagged: true,
      severity,
      reason,
      expiresAt: addHours(now, 72),
    };
  }

  return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
}

/**
 * Check for location anomalies (impossible travel, etc)
 */
async function checkLocationAnomaly(
  userId: string,
  metadata?: Record<string, unknown>
): Promise<FlagResult> {
  const now = new Date();

  // Get user's recent location updates
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      latitude: true,
      longitude: true,
      locationUpdatedAt: true,
    },
  });

  if (!user?.locationUpdatedAt || !metadata?.latitude || !metadata?.longitude) {
    return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
  }

  const timeDiffHours =
    (now.getTime() - user.locationUpdatedAt.getTime()) / (1000 * 60 * 60);

  // Calculate distance between old and new location
  const newLat = metadata.latitude as number;
  const newLng = metadata.longitude as number;
  const oldLat = user.latitude!;
  const oldLng = user.longitude!;

  const distance = calculateHaversineDistance(oldLat, oldLng, newLat, newLng);
  const speed = distance / timeDiffHours; // km/h

  // Impossible travel: > 1000 km/h or > 500 km/h over short times
  if (speed > 1000 || (timeDiffHours < 1 && distance > 100)) {
    const severity = speed > 2000 ? 5 : 4;
    const reason = `Impossible travel detected: ${distance.toFixed(0)} km in ${timeDiffHours.toFixed(1)} hours (${speed.toFixed(0)} km/h)`;

    await createSafetyFlag(userId, 'LOCATION_ANOMALY', severity, reason, {
      distance,
      timeDiffHours,
      speed,
    });

    return {
      isFlagged: true,
      severity,
      reason,
      expiresAt: addHours(now, 24),
    };
  }

  return { isFlagged: false, severity: 0, reason: '', expiresAt: now };
}

/**
 * Create a safety flag in the database
 */
async function createSafetyFlag(
  userId: string,
  type: 'RAPID_SENDING' | 'MASS_BRO_ATTACK' | 'REPEATED_UNWANTED_BROS' | 'BOT_BEHAVIOR' | 'LOCATION_ANOMALY',
  severity: number,
  description: string,
  evidence: Record<string, unknown>
): Promise<void> {
  await prisma.safetyFlag.create({
    data: {
      userId,
      type,
      severity,
      description,
      evidence,
    },
  });

  // Log for manual review if severity is high
  if (severity >= 4) {
    console.warn(`[SAFETY] High severity flag for user ${userId}: ${description}`);
  }
}

/**
 * Calculate haversine distance between two coordinates
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's safety status
 */
export async function getUserSafetyStatus(userId: string) {
  const now = new Date();

  const [flags, recentBros, reports] = await Promise.all([
    prisma.safetyFlag.findMany({
      where: {
        userId,
        isResolved: false,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bro.count({
      where: {
        senderId: userId,
        createdAt: {
          gte: subHours(now, 24),
        },
      },
    }),
    prisma.report.count({
      where: {
        receiverId: userId,
        createdAt: {
          gte: subHours(now, 7 * 24),
        },
      },
    }),
  ]);

  const activeFlags = flags.length;
  const highestSeverity = flags.length > 0 ? Math.max(...flags.map(f => f.severity)) : 0;

  return {
    isFlagged: activeFlags > 0,
    activeFlags,
    highestSeverity,
    recentActivity: {
      brosSent24h: recentBros,
      reportsReceived7d: reports,
    },
    restrictions: getRestrictions(highestSeverity),
  };
}

/**
 * Determine restrictions based on severity
 */
function getRestrictions(severity: number): string[] {
  const restrictions: string[] = [];

  if (severity >= 3) {
    restrictions.push('rate_limited');
  }
  if (severity >= 4) {
    restrictions.push('anonymous_disabled', 'feed_hidden');
  }
  if (severity >= 5) {
    restrictions.push('sending_disabled', 'account_review');
  }

  return restrictions;
}

/**
 * Clean up resolved safety flags (run periodically)
 */
export async function cleanupResolvedFlags(daysToKeep: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.safetyFlag.deleteMany({
    where: {
      isResolved: true,
      resolvedAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
