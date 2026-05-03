import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';
import { calculateBroSuggestions, calculateBroTypeSuggestion } from '@/lib/suggestions/scoring';

// GET - Get smart bro suggestions
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = req.nextUrl.searchParams;
    const includeLocation = searchParams.get('includeLocation') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get users to consider - exclude blocked users
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { issuerId: auth.userId },
          { receiverId: auth.userId },
        ],
      },
    });

    const blockedUserIds = blocks.map(b =>
      b.issuerId === auth.userId ? b.receiverId : b.issuerId
    );
    blockedUserIds.push(auth.userId); // Exclude self

    // Get all users except blocked
    const users = await prisma.user.findMany({
      where: {
        id: { notIn: blockedUserIds },
        AND: {
          NOT: {
            blocksIssued: {
              some: {
                receiverId: auth.userId,
              },
            },
          },
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        image: true,
        bio: true,
        lastActiveAt: true,
        latitude: true,
        longitude: true,
      },
    });

    // Get current user location if location-based
    let userLocation: { latitude: number; longitude: number } | null = null;
    if (includeLocation) {
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { latitude: true, longitude: true },
      });
      if (user?.latitude && user?.longitude) {
        userLocation = {
          latitude: user.latitude,
          longitude: user.longitude,
        };
      }
    }

    // Get interaction patterns
    const interactionLogs = await prisma.interactionLog.findMany({
      where: {
        userId: auth.userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get streaks
    const streaks = await prisma.streak.findMany({
      where: {
        OR: [
          { user1Id: auth.userId },
          { user2Id: auth.userId },
        ],
      },
    });

    // Calculate suggestions
    const suggestions = calculateBroSuggestions({
      currentUserId: auth.userId,
      users,
      interactionLogs,
      streaks,
      userLocation,
      limit,
    });

    // Get personality profile for bro type suggestion
    const personalityProfile = await prisma.personalityProfile.findUnique({
      where: { userId: auth.userId },
    });

    const broTypeSuggestion = calculateBroTypeSuggestion(personalityProfile);

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        broTypeSuggestion,
        totalAvailable: users.length,
      },
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
