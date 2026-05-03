import { User as PrismaUser, Streak, InteractionLog, PersonalityProfile } from '@prisma/client';
import { BroSuggestion, BroType, SuggestionReason, InteractionPattern, UserPublicProfile } from '@/types';
import { calculateDistance } from '@/lib/utils';

interface SuggestionInput {
  currentUserId: string;
  users: PrismaUser[];
  interactionLogs: InteractionLog[];
  streaks: Streak[];
  userLocation: { latitude: number; longitude: number } | null;
  limit: number;
}

/**
 * Parse metadata JSON from InteractionLog
 */
function parseMetadata(log: InteractionLog): Record<string, unknown> {
  if (!log.metadata) return {};
  try {
    return JSON.parse(log.metadata) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Calculate smart bro suggestions for a user
 * Uses multiple factors to rank who the user is most likely to bro
 */
export function calculateBroSuggestions(input: SuggestionInput): BroSuggestion[] {
  const { currentUserId, users, interactionLogs, streaks, userLocation, limit } = input;

  // Create lookup maps for efficiency
  const interactionMap = buildInteractionMap(interactionLogs);
  const streakMap = buildStreakMap(streaks, currentUserId);

  // Calculate scores for each potential user
  const scoredUsers = users
    .filter(user => user.id !== currentUserId)
    .map(user => {
      const { score, reasons } = calculateUserScore(
        currentUserId,
        user,
        interactionMap.get(user.id),
        streakMap.get(user.id),
        userLocation
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName || undefined,
          image: user.image || undefined,
          bio: user.bio || undefined,
          brosSent: 0,
          brosReceived: 0,
          currentStreak: 0,
          bestStreak: 0,
          isOnline: new Date(user.lastActiveAt).getTime() > Date.now() - 5 * 60 * 1000,
          lastActiveAt: user.lastActiveAt,
          ...(user.latitude && user.longitude ? { latitude: user.latitude, longitude: user.longitude } : {}),
        } as UserPublicProfile,
        score,
        reasons,
        rank: 0,
        confidence: Math.min(score / 10, 1), // Normalize to 0-1
      };
    });

  // Sort by score and assign ranks
  const rankedUsers = scoredUsers
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  // Predict best bro type for each suggestion
  return rankedUsers.map(suggestion => ({
    ...suggestion,
    predictedBroType: predictBestBroType(suggestion.user.id, interactionLogs),
  }));
}

/**
 * Build a map of userId -> interaction patterns
 */
function buildInteractionMap(logs: InteractionLog[]): Map<string, InteractionPattern> {
  const map = new Map<string, InteractionPattern>();

  for (const log of logs) {
    const metadata = parseMetadata(log);
    const targetUserId = (metadata.targetUserId as string) || log.targetId;
    if (!targetUserId) continue;

    const existing = map.get(targetUserId);
    const timeToRespond = (metadata.timeToRespondMinutes as number) || 0;
    const score = (metadata.score as number) || 0;

    if (!existing) {
      map.set(targetUserId, {
        userId: targetUserId,
        totalInteractions: 1,
        avgResponseTime: timeToRespond,
        lastInteractionAt: log.createdAt,
        interactionStrength: score,
      });
    } else {
      // Update existing pattern
      const totalInteractions = existing.totalInteractions + 1;
      const avgResponseTime =
        ((existing.avgResponseTime * existing.totalInteractions) +
          timeToRespond) /
        totalInteractions;

      map.set(targetUserId, {
        ...existing,
        totalInteractions,
        avgResponseTime,
        lastInteractionAt:
          log.createdAt > existing.lastInteractionAt
            ? log.createdAt
            : existing.lastInteractionAt,
        interactionStrength: existing.interactionStrength + score,
      });
    }
  }

  return map;
}

/**
 * Build a map of userId -> streak info
 */
function buildStreakMap(
  streaks: Streak[],
  currentUserId: string
): Map<string, { count: number; totalBros: number; expiresAt: Date; isActive: boolean }> {
  const map = new Map();

  for (const streak of streaks) {
    const otherUserId =
      streak.user1Id === currentUserId ? streak.user2Id : streak.user1Id;

    const isActive = new Date(streak.expiresAt) > new Date();

    map.set(otherUserId, {
      count: streak.count,
      totalBros: streak.totalBros,
      expiresAt: streak.expiresAt,
      isActive,
    });
  }

  return map;
}

/**
 * Calculate score for a potential user
 * Returns score and reasons for the suggestion
 */
function calculateUserScore(
  currentUserId: string,
  user: PrismaUser,
  interactionPattern: InteractionPattern | undefined,
  streakInfo: { count: number; totalBros: number; expiresAt: Date; isActive: boolean } | undefined,
  userLocation: { latitude: number; longitude: number } | null
): { score: number; reasons: SuggestionReason[] } {
  let score = 0;
  const reasons: SuggestionReason[] = [];

  // 1. Interaction Frequency (40% weight)
  if (interactionPattern) {
    const interactionScore = Math.min(interactionPattern.totalInteractions * 2, 20);
    score += interactionScore;

    reasons.push({
      type: 'interaction_frequency',
      weight: 0.4,
      description: `${interactionPattern.totalInteractions} past interactions`,
    });

    // Response time bonus (faster = better)
    if (interactionPattern.avgResponseTime > 0) {
      const responseTimeScore = Math.max(0, 10 - interactionPattern.avgResponseTime * 0.5);
      score += responseTimeScore;
    }
  }

  // 2. Recency of Interaction (25% weight)
  if (interactionPattern?.lastInteractionAt) {
    const hoursSinceLastContact =
      (Date.now() - new Date(interactionPattern.lastInteractionAt).getTime()) /
      (1000 * 60 * 60);

    // Higher score for recent interactions (within 24h), but not too recent (< 1h)
    let recencyScore = 0;
    if (hoursSinceLastContact < 1) {
      recencyScore = 5; // Just contacted
    } else if (hoursSinceLastContact < 24) {
      recencyScore = 15; // Contacted recently
    } else if (hoursSinceLastContact < 48) {
      recencyScore = 10; // Contacted yesterday
    } else if (hoursSinceLastContact < 168) {
      recencyScore = 5; // Within a week
    }

    if (recencyScore > 0) {
      score += recencyScore;
      reasons.push({
        type: 'recency',
        weight: 0.25,
        description:
          hoursSinceLastContact < 1
            ? 'Just contacted'
            : hoursSinceLastContact < 24
            ? 'Contacted in last 24h'
            : 'Contacted recently',
      });
    }
  }

  // 3. Active Streak (20% weight)
  if (streakInfo) {
    const streakScore = Math.min(streakInfo.count * 3, 30);
    score += streakScore;

    if (streakInfo.isActive) {
      const hoursRemaining =
        (new Date(streakInfo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

      if (hoursRemaining < 6) {
        score += 15; // Urgent: streak expires soon
        reasons.push({
          type: 'mutual_streak',
          weight: 0.3,
          description: `Streak expires in ${Math.round(hoursRemaining)} hours!`,
        });
      } else {
        reasons.push({
          type: 'mutual_streak',
          weight: 0.2,
          description: `${streakInfo.count} day streak${streakInfo.count > 1 ? 's' : ''}`,
        });
      }
    } else {
      // Streak was broken recently - opportunity to restart
      reasons.push({
        type: 'mutual_streak',
        weight: 0.1,
        description: `Had ${streakInfo.count} day streak before`,
      });
    }
  }

  // 4. Location Proximity (10% weight)
  if (userLocation && user.latitude && user.longitude) {
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      user.latitude,
      user.longitude
    );

    if (distance < 100) {
      score += 10;
      reasons.push({
        type: 'location',
        weight: 0.1,
        description: 'Very nearby',
      });
    } else if (distance < 1000) {
      score += 5;
      reasons.push({
        type: 'location',
        weight: 0.1,
        description: 'Nearby',
      });
    }
  }

  // 5. Online Status (5% weight)
  const lastActiveDiff = Date.now() - new Date(user.lastActiveAt).getTime();
  if (lastActiveDiff < 5 * 60 * 1000) {
    // Online now
    score += 5;
    reasons.push({
      type: 'likes_sending',
      weight: 0.05,
      description: 'Online now',
    });
  }

  // Bonus for mutual interest (both users have interacted)
  if (interactionPattern && interactionPattern.totalInteractions > 5) {
    score += interactionPattern.totalInteractions;
    reasons.push({
      type: 'likes_sending',
      weight: 0.1,
      description: 'High mutual interest',
    });
  }

  return { score, reasons };
}

/**
 * Calculate the best bro type suggestion for a user
 */
export function calculateBroTypeSuggestion(
  personalityProfile: PersonalityProfile | null
): { broType: BroType; confidence: number; reason: string } | null {
  if (!personalityProfile) return null;

  const counts = {
    AGGRESSIVE: personalityProfile.aggressiveCount,
    FUNNY: personalityProfile.funnyCount,
    COLD: personalityProfile.coldCount,
    HEARTBREAK: personalityProfile.heartbreakCount,
    RESPECT: personalityProfile.respectCount,
  };

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const best = entries[0];

  const confidence = best[1] / total;

  const reasons: Record<string, string> = {
    AGGRESSIVE: 'You often send energetic, aggressive bros',
    FUNNY: 'You like to keep things light and funny',
    COLD: 'Your cold bros are legendary',
    HEARTBREAK: 'You send deep, emotional bros',
    RESPECT: 'You show respect to your bros',
  };

  return {
    broType: best[0] as BroType,
    confidence: Math.round(confidence * 100) / 100,
    reason: reasons[best[0]],
  };
}

/**
 * Predict the best bro type for a specific target user
 * Based on past interactions with that user
 */
function predictBestBroType(
  targetUserId: string,
  interactionLogs: InteractionLog[]
): BroType | undefined {
  const typeCounts: Record<string, number> = {};

  for (const log of interactionLogs) {
    const metadata = parseMetadata(log);
    const logTargetUserId = (metadata.targetUserId as string) || log.targetId;
    const broType = metadata.broType as string;

    if (logTargetUserId === targetUserId && broType) {
      typeCounts[broType] = (typeCounts[broType] || 0) + 1;
    }
  }

  const entries = Object.entries(typeCounts);
  if (entries.length === 0) return undefined;

  return entries.sort((a, b) => b[1] - a[1])[0][0] as BroType;
}

/**
 * Get location-based suggestions
 * Find users near the current user who are active
 */
export function getNearbySuggestions(
  currentUserId: string,
  nearbyUsers: { user: PrismaUser; distance: number }[],
  limit: number = 5
): BroSuggestion[] {
  return nearbyUsers
    .filter(u => u.user.id !== currentUserId)
    .slice(0, limit)
    .map((item, index) => ({
      user: {
        id: item.user.id,
        username: item.user.username,
        displayName: item.user.displayName || undefined,
        image: item.user.image || undefined,
        bio: item.user.bio || undefined,
        brosSent: 0,
        brosReceived: 0,
        currentStreak: 0,
        bestStreak: 0,
        isOnline: new Date(item.user.lastActiveAt).getTime() > Date.now() - 5 * 60 * 1000,
        lastActiveAt: item.user.lastActiveAt,
        ...(item.user.latitude && item.user.longitude ? { latitude: item.user.latitude, longitude: item.user.longitude } : {}),
      } as UserPublicProfile,
      score: Math.max(0, 20 - item.distance / 100), // Closer = higher score
      rank: index + 1,
      reasons: [
        {
          type: 'location',
          weight: 1.0,
          description: item.distance < 100
            ? 'Right nearby!'
            : item.distance < 500
            ? 'Close by'
            : 'In your area',
        },
      ],
      predictedBroType: undefined,
      confidence: Math.max(0.3, 1 - item.distance / 1000),
    }));
}

/**
 * Get streak-based suggestions
 * Prioritize streaks that are about to expire
 */
export function getStreakSuggestions(
  currentUserId: string,
  streaks: Streak[],
  limit: number = 5
): Array<{ streak: Streak; urgency: 'critical' | 'high' | 'medium' | 'low'; hoursRemaining: number }> {
  const mapped = streaks
    .map(streak => {
      const hoursRemaining =
        (new Date(streak.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);

      let urgency: 'critical' | 'high' | 'medium' | 'low';
      if (hoursRemaining < 2) urgency = 'critical';
      else if (hoursRemaining < 6) urgency = 'high';
      else if (hoursRemaining < 12) urgency = 'medium';
      else urgency = 'low';

      return { streak, urgency, hoursRemaining };
    });

  return mapped
    .filter(item => item.hoursRemaining > 0)
    .sort((a, b) => a.hoursRemaining - b.hoursRemaining)
    .slice(0, limit);
}

/**
 * Calculate engagement prediction for a bro
 * Probability that the target user will respond
 */
export function predictEngagement(
  currentUserId: string,
  targetUserId: string,
  interactionLogs: InteractionLog[],
  streaks: Streak[]
): number {
  let score = 0;
  const maxScore = 100;

  // Past interaction rate
  const interactionsWithTarget = interactionLogs.filter(log => {
    const metadata = parseMetadata(log);
    const logTargetUserId = (metadata.targetUserId as string) || log.targetId;
    return logTargetUserId === targetUserId;
  });

  if (interactionsWithTarget.length > 0) {
    const responseRate =
      interactionsWithTarget.filter(log => {
        const metadata = parseMetadata(log);
        return metadata.type === 'REACTION_SENT';
      }).length /
      interactionsWithTarget.length;
    score += responseRate * 40;
  }

  // Active streak bonus
  const hasActiveStreak = streaks.some(
    s =>
      (s.user1Id === currentUserId && s.user2Id === targetUserId) ||
      (s.user1Id === targetUserId && s.user2Id === currentUserId)
  );

  if (hasActiveStreak) {
    score += 30;
  }

  // Response time bonus
  const responseTimes = interactionsWithTarget
    .map(log => {
      const metadata = parseMetadata(log);
      return metadata.timeToRespondMinutes as number | undefined;
    })
    .filter((t): t is number => t !== undefined);

  if (responseTimes.length > 0) {
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    if (avgResponseTime < 30) score += 20;
    else if (avgResponseTime < 120) score += 10;
  }

  // Recency bonus
  const lastInteraction = interactionsWithTarget[interactionsWithTarget.length - 1];
  if (lastInteraction) {
    const hoursSince =
      (Date.now() - new Date(lastInteraction.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 24) score += 10;
  }

  return Math.min(Math.round(score), maxScore);
}
