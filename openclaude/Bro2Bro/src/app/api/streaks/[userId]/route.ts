import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';

// GET - Get streak with specific user
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { userId } = params;

    // Find or create streak
    let streak = await prisma.streak.findFirst({
      where: {
        OR: [
          { user1Id: auth.userId, user2Id: userId },
          { user1Id: userId, user2Id: auth.userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
      },
    });

    // If no streak exists, return null but with template structure
    if (!streak) {
      const otherUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          image: true,
        },
      });

      if (!otherUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          streak: null,
          otherUser,
          isNew: true,
        },
      });
    }

    const isUser1 = streak.user1Id === auth.userId;
    const otherUser = isUser1 ? streak.user2 : streak.user1;
    const timeRemaining = Math.max(0, new Date(streak.expiresAt).getTime() - Date.now());
    const isActive = timeRemaining > 0 && streak.count > 0;

    return NextResponse.json({
      success: true,
      data: {
        streak: {
          id: streak.id,
          count: streak.count,
          bestCount: streak.bestCount,
          lastBroAt: streak.lastBroAt,
          expiresAt: streak.expiresAt,
          totalBros: streak.totalBros,
          timeRemaining: Math.floor(timeRemaining / 1000),
          isActive,
        },
        otherUser,
        isNew: false,
      },
    });
  } catch (error) {
    console.error('Get streak error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get streak' },
      { status: 500 }
    );
  }
}
