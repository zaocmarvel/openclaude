import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';

// GET - Get user's streaks
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'active' or 'all'

    const where: Record<string, unknown> = {
      OR: [
        { user1Id: auth.userId },
        { user2Id: auth.userId },
      ],
    };

    if (status === 'active') {
      where.expiresAt = {
        gt: new Date(),
      };
    }

    const streaks = await prisma.streak.findMany({
      where,
      orderBy: [{ count: 'desc' }, { lastBroAt: 'desc' }],
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
            lastActiveAt: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
            lastActiveAt: true,
          },
        },
      },
    });

    // Format streaks with resolved other user and time remaining
    const formattedStreaks = streaks.map(streak => {
      const isUser1 = streak.user1Id === auth.userId;
      const otherUser = isUser1 ? streak.user2 : streak.user1;
      const timeRemaining = Math.max(0, new Date(streak.expiresAt).getTime() - Date.now());
      const isActive = timeRemaining > 0 && streak.count > 0;

      return {
        id: streak.id,
        count: streak.count,
        bestCount: streak.bestCount,
        lastBroAt: streak.lastBroAt,
        expiresAt: streak.expiresAt,
        totalBros: streak.totalBros,
        timeRemaining: Math.floor(timeRemaining / 1000),
        isActive,
        otherUser,
      };
    });

    // Calculate stats
    const activeStreaks = formattedStreaks.filter(s => s.isActive).length;
    const bestStreak = Math.max(0, ...formattedStreaks.map(s => s.bestCount));
    const totalBrosSent = formattedStreaks.reduce((sum, s) => sum + s.totalBros, 0);

    return NextResponse.json({
      success: true,
      data: {
        streaks: formattedStreaks,
        stats: {
          activeStreaks,
          bestStreak,
          totalBrosSent,
          totalConnections: formattedStreaks.length,
        },
      },
    });
  } catch (error) {
    console.error('Get streaks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get streaks' },
      { status: 500 }
    );
  }
}
