import prisma from '../db';
import { addHours, differenceInHours } from 'date-fns';
import { createNotification } from './notifications';
import { recordInteraction } from '../safety/rate-limit';

/**
 * Update the streak between two users
 * Called when a bro is sent/received
 */
export async function updateStreak(user1Id: string, user2Id: string) {
  // Normalize user order for consistent lookup
  const [id1, id2] = [user1Id, user2Id].sort();

  // Find existing streak
  let streak = await prisma.streak.findUnique({
    where: {
      user1Id_user2Id: {
        user1Id: id1,
        user2Id: id2,
      },
    },
  });

  const now = new Date();

  if (!streak) {
    // Create new streak
    streak = await prisma.streak.create({
      data: {
        user1Id: id1,
        user2Id: id2,
        count: 1,
        bestCount: 1,
        lastBroAt: now,
        expiresAt: addHours(now, 24),
        totalBros: 1,
      },
    });
  } else {
    // Check if streak is still active
    const isActive = new Date(streak.expiresAt) > now;
    const timeSinceLastBro = differenceInHours(now, new Date(streak.lastBroAt));

    if (isActive) {
      // Only increment if enough time has passed (at least 1 hour between bros)
      if (timeSinceLastBro >= 1) {
        const newCount = streak.count + 1;
        streak = await prisma.streak.update({
          where: { id: streak.id },
          data: {
            count: newCount,
            bestCount: Math.max(streak.bestCount, newCount),
            lastBroAt: now,
            expiresAt: addHours(now, 24),
            totalBros: { increment: 1 },
          },
        });

        // Send streak update notification for milestones
        if (newCount === 7 || newCount === 30 || newCount === 100) {
          await Promise.all([
            createNotification({
              userId: user1Id,
              type: 'STREAK_UPDATE',
              title: `${newCount} Day Streak! 🔥`,
              message: `You and your bro have hit a ${newCount} day streak! Keep it going!`,
            }),
            createNotification({
              userId: user2Id,
              type: 'STREAK_UPDATE',
              title: `${newCount} Day Streak! 🔥`,
              message: `You and your bro have hit a ${newCount} day streak! Keep it going!`,
            }),
          ]);
        }

        // Record streak extension
        await Promise.all([
          recordInteraction(user1Id, user2Id, 'STREAK_EXTENDED'),
          recordInteraction(user2Id, user1Id, 'STREAK_EXTENDED'),
        ]);
      }
    } else {
      // Streak broken - reset to 1
      streak = await prisma.streak.update({
        where: { id: streak.id },
        data: {
          count: 1,
          lastBroAt: now,
          expiresAt: addHours(now, 24),
          totalBros: { increment: 1 },
        },
      });

      // Send streak broken notification
      await Promise.all([
        createNotification({
          userId: user1Id,
          type: 'STREAK_BROKEN',
          title: 'Streak Lost 💔',
          message: `Your streak was reset. Start a new one today!`,
        }),
        createNotification({
          userId: user2Id,
          type: 'STREAK_BROKEN',
          title: 'Streak Lost 💔',
          message: `Your streak was reset. Start a new one today!`,
        }),
      ]);

      // Record streak break
      await Promise.all([
        recordInteraction(user1Id, user2Id, 'STREAK_BROKEN'),
        recordInteraction(user2Id, user1Id, 'STREAK_BROKEN'),
      ]);
    }
  }

  return streak;
}

/**
 * Check for expired streaks and send notifications
 * Should be run periodically (e.g., every hour)
 */
export async function checkExpiredStreaks() {
  const now = new Date();

  const expiringStreaks = await prisma.streak.findMany({
    where: {
      expiresAt: {
        lte: addHours(now, 2), // Expiring in next 2 hours
        gte: now,
      },
      count: { gt: 3 }, // Only for streaks of 3+ days
    },
    include: {
      user1: { select: { id: true } },
      user2: { select: { id: true } },
    },
  });

  for (const streak of expiringStreaks) {
    const hoursRemaining = differenceInHours(new Date(streak.expiresAt), now);

    await Promise.all([
      createNotification({
        userId: streak.user1.id,
        type: 'STREAK_UPDATE',
        title: `Streak Expires in ${hoursRemaining}h! ⏰`,
        message: `Your ${streak.count} day streak is about to expire. Send a bro now!`,
      }),
      createNotification({
        userId: streak.user2.id,
        type: 'STREAK_UPDATE',
        title: `Streak Expires in ${hoursRemaining}h! ⏰`,
        message: `Your ${streak.count} day streak is about to expire. Send a bro now!`,
      }),
    ]);
  }

  return expiringStreaks.length;
}

/**
 * Get streak statistics for a user
 */
export async function getStreakStats(userId: string) {
  const [activeStreaks, totalStreaks, longestStreak] = await Promise.all([
    prisma.streak.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        expiresAt: { gt: new Date() },
        count: { gt: 0 },
      },
    }),
    prisma.streak.count({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
    }),
    prisma.streak.findFirst({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { bestCount: 'desc' },
    }),
  ]);

  return {
    activeStreaks,
    totalStreaks,
    longestStreak: longestStreak?.bestCount || 0,
    currentBest: longestStreak?.count || 0,
  };
}
