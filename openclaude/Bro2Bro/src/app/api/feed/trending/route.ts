import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';

// GET - Get trending bros (time-decayed engagement)
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = req.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '24h';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate cutoff time based on timeframe
    const cutoffHours = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720,
    }[timeframe] || 24;

    const cutoffDate = new Date(Date.now() - cutoffHours * 60 * 60 * 1000);

    // Get bros with high engagement in timeframe
    const bros = await prisma.bro.findMany({
      where: {
        createdAt: { gte: cutoffDate },
        isAnonymous: false,
        reactionCount: { gt: 0 },
      },
      orderBy: [
        { reactionCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
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
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    // Calculate trending scores
    const trendingBros = bros.map(bro => {
      const ageMinutes = (Date.now() - new Date(bro.createdAt).getTime()) / (1000 * 60);
      const reactions = bro._count.reactions;

      // Hotness score: (reactions^1.5) / (age_minutes + 60)^0.5
      const hotnessScore = Math.pow(reactions, 1.5) / Math.pow(ageMinutes + 60, 0.5);

      return {
        ...bro,
        hotnessScore: Math.round(hotnessScore * 100) / 100,
        trendingRank: 0, // Will be set after sorting
      };
    });

    // Sort by hotness and assign ranks
    trendingBros.sort((a, b) => b.hotnessScore - a.hotnessScore);
    trendingBros.forEach((bro, index) => {
      bro.trendingRank = index + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        bros: trendingBros,
        timeframe,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Get trending error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get trending bros' },
      { status: 500 }
    );
  }
}
