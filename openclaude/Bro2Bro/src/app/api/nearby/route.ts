import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';
import { calculateDistance, getDirection } from '@/lib/utils';

// GET - Get nearby users
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = req.nextUrl.searchParams;
    const radius = parseInt(searchParams.get('radius') || '5000'); // Default 5km radius
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get current user's location
    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!currentUser?.latitude || !currentUser?.longitude) {
      return NextResponse.json(
        { success: false, error: 'Location not available. Please update your location first.' },
        { status: 400 }
      );
    }

    const { latitude: userLat, longitude: userLng } = currentUser;

    // Get blocked users
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
    blockedUserIds.push(auth.userId);

    // Approximate bounding box for initial filter (improves performance)
    // 1 degree latitude ~ 111km
    const latDelta = radius / 111000;
    // 1 degree longitude varies with latitude
    const lngDelta = radius / (111000 * Math.cos(userLat * Math.PI / 180));

    const nearbyUsers = await prisma.user.findMany({
      where: {
        id: { notIn: blockedUserIds },
        latitude: {
          gte: userLat - latDelta,
          lte: userLat + latDelta,
        },
        longitude: {
          gte: userLng - lngDelta,
          lte: userLng + lngDelta,
        },
        locationUpdatedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Updated within 24h
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
        _count: {
          select: {
            sentBros: true,
            receivedBros: true,
          },
        },
      },
      take: limit * 2, // Fetch more for filtering
    });

    // Calculate exact distances and filter
    const usersWithDistance = nearbyUsers
      .map(user => {
        const distance = calculateDistance(
          userLat,
          userLng,
          user.latitude!,
          user.longitude!
        );

        const direction = getDirection(
          { lat: userLat, lng: userLng },
          { lat: user.latitude!, lng: user.longitude! }
        );

        // Check if online (last active within 5 minutes)
        const isOnline = new Date(user.lastActiveAt) > new Date(Date.now() - 5 * 60 * 1000);

        return {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          image: user.image,
          bio: user.bio,
          distance,
          direction,
          isOnline,
          lastActiveAt: user.lastActiveAt,
          brosStats: {
            sent: user._count.sentBros,
            received: user._count.receivedBros,
          },
        };
      })
      .filter(user => user.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    // Identify clusters (areas with many users)
    const clusters = identifyClusters(usersWithDistance, radius);

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithDistance,
        clusters,
        radius,
        userLocation: {
          latitude: userLat,
          longitude: userLng,
        },
      },
    });
  } catch (error) {
    console.error('Get nearby error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get nearby users' },
      { status: 500 }
    );
  }
}

function identifyClusters(
  users: Array<{ distance: number; direction: string }>,
  radius: number
): Array<{ direction: string; count: number; description: string }> {
  if (users.length === 0) return [];

  const directionCounts: Record<string, number> = {};

  users.forEach(user => {
    directionCounts[user.direction] = (directionCounts[user.direction] || 0) + 1;
  });

  return Object.entries(directionCounts)
    .filter(([, count]) => count >= 3) // At least 3 users in a direction
    .map(([direction, count]) => ({
      direction,
      count,
      description: `${count} bro${count > 1 ? 's' : ''} to the ${direction}`,
    }))
    .sort((a, b) => b.count - a.count);
}
