import prisma from '../db';
import { addMinutes } from 'date-fns';
import { InteractionType, BroType } from '@/types';

interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  bro_send: { maxRequests: 30, windowMinutes: 60 },      // 30 bros per hour
  reaction: { maxRequests: 100, windowMinutes: 60 },     // 100 reactions per hour
  feed_request: { maxRequests: 60, windowMinutes: 1 },   // 60 feed loads per minute
  search: { maxRequests: 30, windowMinutes: 1 },         // 30 searches per minute
  notification: { maxRequests: 50, windowMinutes: 60 },  // 50 notification checks per hour
};

interface RateLimitResult {
  isLimited: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // seconds
}

/**
 * Check if user has exceeded rate limit for an action
 */
export async function checkRateLimit(
  userId: string,
  action: string
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[action];

  if (!config) {
    // No rate limit configured for this action
    return { isLimited: false, remaining: Infinity, resetAt: new Date() };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);
  const resetAt = addMinutes(now, config.windowMinutes);

  // Count interactions in the current window
  const count = await prisma.interactionLog.count({
    where: {
      userId,
      action,
      createdAt: {
        gte: windowStart,
      },
    },
  });

  const remaining = Math.max(0, config.maxRequests - count);
  const isLimited = count >= config.maxRequests;

  // Log this interaction (increment count)
  if (!isLimited) {
    await prisma.interactionLog.create({
      data: {
        userId,
        targetId: 'rate-limit-check',
        targetType: 'RATE_LIMIT',
        action,
      },
    });
  }

  return {
    isLimited,
    remaining,
    resetAt,
    retryAfter: isLimited
      ? Math.ceil((resetAt.getTime() - now.getTime()) / 1000)
      : undefined,
  };
}

/**
 * Record user interaction for analytics and safety
 */
export async function recordInteraction(
  userId: string,
  targetUserId: string | null,
  type: string,
  broType?: string,
  wasMutual: boolean = false
): Promise<void> {
  // Calculate interaction score based on type
  const scoreWeights: Record<string, number> = {
    BRO_SENT: 1.0,
    BRO_RECEIVED: 0.8,
    REACTION_SENT: 0.6,
    REACTION_RECEIVED: 0.5,
    STREAK_EXTENDED: 2.0,
    STREAK_BROKEN: -1.0,
    PROFILE_VIEWED: 0.2,
  };

  await prisma.interactionLog.create({
    data: {
      userId,
      targetId: targetUserId || 'unknown',
      targetType: 'USER',
      action: type,
      metadata: JSON.stringify({ broType, wasMutual }),
    },
  });
}

/**
 * Get interaction summary between two users
 */
export async function getInteractionSummary(
  userId1: string,
  userId2: string
): Promise<{
  totalInteractions: number;
  lastInteractionAt: Date | null;
  interactionStrength: number;
}> {
  const interactions = await prisma.interactionLog.findMany({
    where: {
      OR: [
        { userId: userId1, targetId: userId2 },
        { userId: userId2, targetId: userId1 },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (interactions.length === 0) {
    return {
      totalInteractions: 0,
      lastInteractionAt: null,
      interactionStrength: 0,
    };
  }

  // Calculate score from metadata if available
  const totalScore = interactions.reduce((sum, i) => {
    if (i.metadata) {
      try {
        const meta = JSON.parse(i.metadata);
        return sum + (meta.score || 0.5);
      } catch {
        return sum + 0.5;
      }
    }
    return sum + 0.5;
  }, 0);

  const timeDecay = Math.exp(
    -0.001 * (Date.now() - interactions[0].createdAt.getTime())
  );

  return {
    totalInteractions: interactions.length,
    lastInteractionAt: interactions[0].createdAt,
    interactionStrength: totalScore * timeDecay,
  };
}

/**
 * Clean up old interaction logs (run periodically)
 */
export async function cleanupRateLimits(hoursToKeep: number = 24): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hoursToKeep);

  const result = await prisma.interactionLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Batch rate limit check for multiple actions
 */
export async function checkMultipleRateLimits(
  userId: string,
  actions: string[]
): Promise<Record<string, RateLimitResult>> {
  const results: Record<string, RateLimitResult> = {};

  for (const action of actions) {
    results[action] = await checkRateLimit(userId, action);
  }

  return results;
}

/**
 * Global rate limiting for anonymous users by IP
 * (Simplified - in production this would use Redis or similar)
 */
const ipRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkIPRateLimit(ip: string, action: string): RateLimitResult {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const config = RATE_LIMITS[action] || { maxRequests: 10, windowMinutes: 1 };

  let limit = ipRateLimits.get(key);

  if (!limit || now > limit.resetAt) {
    limit = {
      count: 0,
      resetAt: now + config.windowMinutes * 60 * 1000,
    };
    ipRateLimits.set(key, limit);
  }

  limit.count++;

  const remaining = Math.max(0, config.maxRequests - limit.count);
  const isLimited = limit.count > config.maxRequests;

  return {
    isLimited,
    remaining,
    resetAt: new Date(limit.resetAt),
    retryAfter: isLimited
      ? Math.ceil((limit.resetAt - now) / 1000)
      : undefined,
  };
}
