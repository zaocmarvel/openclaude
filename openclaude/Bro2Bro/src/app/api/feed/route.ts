import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';
import { calculateFeedRanking } from '@/lib/ranking/feed-ranker';

// GET - Get global feed with viral ranking
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type'); // Filter by bro type
    const cursor = searchParams.get('cursor'); // Pagination cursor
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filters
    const where: Record<string, unknown> = {
      isAnonymous: false, // Only show non-anonymous bros in feed
    };

    if (type && ['AGGRESSIVE', 'FUNNY', 'COLD', 'HEARTBREAK', 'RESPECT'].includes(type)) {
      where.type = type;
    }

    // Get bros with engagement data
    const bros = await prisma.bro.findMany({
      where,
      orderBy: [
        { engagementScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    // Get user's reactions to these bros
    const broIds = bros.map(b => b.id);
    const userReactions = await prisma.reaction.findMany({
      where: {
        broId: { in: broIds },
        userId: auth.userId,
      },
    });

    const userReactionMap = new Map(userReactions.map(r => [r.broId, r]));

    // Calculate rankings and format response
    const rankedBros = bros
      .map(bro => {
        const engagementRate = bro._count.reactions / Math.max(1, (Date.now() - new Date(bro.createdAt).getTime()) / (1000 * 60 * 60));
        const ageHours = (Date.now() - new Date(bro.createdAt).getTime()) / (1000 * 60 * 60);

        return {
          ...bro,
          userReaction: userReactionMap.get(bro.id) || null,
          engagementMetrics: {
            reactionCount: bro._count.reactions,
            viewCount: Math.floor(bro.engagementScore * 10),
            engagementRate,
            trendingScore: bro.engagementScore,
            viralCoefficent: Math.log10(Math.max(1, bro._count.reactions)),
            ageHours,
          },
        };
      })
      .sort((a, b) => {
        // Use calculated ranking
        const rankA = calculateFeedRanking(a);
        const rankB = calculateFeedRanking(b);
        return rankB - rankA;
      });

    // Get next cursor
    const nextCursor = bros.length === limit ? bros[bros.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: {
        bros: rankedBros,
        nextCursor,
        hasMore: !!nextCursor,
      },
    });
  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get feed' },
      { status: 500 }
    );
  }
}
