import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';

// GET - Get current user's profile
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        image: true,
        soundEnabled: true,
        notificationsEnabled: true,
        isAnonymousMode: true,
        onboardingCompleted: true,
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

    // Get active streaks count
    const activeStreaks = await prisma.streak.count({
      where: {
        OR: [
          { user1Id: auth.userId },
          { user2Id: auth.userId },
        ],
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        brosSent: user._count.sentBros,
        brosReceived: user._count.receivedBros,
        activeStreaks,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { displayName, bio, image, soundEnabled, notificationsEnabled, isAnonymousMode } = await req.json();

    // Validate inputs
    if (bio && bio.length > 160) {
      return NextResponse.json(
        { success: false, error: 'Bio must be 160 characters or less' },
        { status: 400 }
      );
    }

    if (displayName && displayName.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Display name must be 50 characters or less' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: auth.userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(image !== undefined && { image }),
        ...(soundEnabled !== undefined && { soundEnabled }),
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
        ...(isAnonymousMode !== undefined && { isAnonymousMode }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        bio: true,
        image: true,
        soundEnabled: true,
        notificationsEnabled: true,
        isAnonymousMode: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
