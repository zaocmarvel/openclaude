import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET - Get public profile by username
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        image: true,
        lastActiveAt: true,
        createdAt: true,
        _count: {
          select: {
            sentBros: true,
            receivedBros: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get best streak
    const streaks = await prisma.streak.findMany({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id },
        ],
      },
      orderBy: { bestCount: 'desc' },
      take: 1,
    });

    const bestStreak = streaks[0]?.bestCount || 0;
    const currentStreak = streaks.find(
      s => s.expiresAt > new Date() && s.count > 0
    )?.count || 0;

    // Check if online (active in last 5 minutes)
    const isOnline = new Date(user.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        image: user.image,
        brosSent: user._count.sentBros,
        brosReceived: user._count.receivedBros,
        currentStreak,
        bestStreak,
        isOnline,
        memberSince: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}
