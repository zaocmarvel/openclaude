import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';
import { BroType, BroStatus } from '@/types';
import { checkRateLimit, recordInteraction } from '@/lib/safety/rate-limit';
import { flagSuspiciousActivity } from '@/lib/safety/abuse-detection';
import { createNotification } from '@/lib/services/notifications';
import { updateStreak } from '@/lib/services/streaks';
import { updatePersonalityProfile } from '@/lib/services/personality';

// GET - Get user's bros (sent or received)
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'sent', 'received', or 'all'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let where: Record<string, unknown> = {};

    if (type === 'sent') {
      where = { senderId: auth.userId };
    } else if (type === 'received') {
      where = { receiverId: auth.userId };
    } else {
      where = {
        OR: [
          { senderId: auth.userId },
          { receiverId: auth.userId },
        ],
      };
    }

    const [bros, totalCount] = await Promise.all([
      prisma.bro.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
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
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                },
              },
            },
          },
        },
      }),
      prisma.bro.count({ where }),
    ]);

    // Mark received bros as viewed
    const receivedBros = bros.filter(
      bro => bro.receiverId === auth.userId && bro.status === 'PENDING'
    );

    if (receivedBros.length > 0) {
      await prisma.bro.updateMany({
        where: {
          id: { in: receivedBros.map(b => b.id) },
        },
        data: {
          status: 'VIEWED',
          viewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        bros,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + bros.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Get bros error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get bros' },
      { status: 500 }
    );
  }
}

// POST - Send a new bro
export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Check rate limit
    const rateLimit = await checkRateLimit(auth.userId, 'bro_send');
    if (rateLimit.isLimited) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const { receiverId, type, message, isAnonymous } = await req.json();

    // Validation
    if (!receiverId || !type) {
      return NextResponse.json(
        { success: false, error: 'Receiver and bro type are required' },
        { status: 400 }
      );
    }

    if (!['AGGRESSIVE', 'FUNNY', 'COLD', 'HEARTBREAK', 'RESPECT'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bro type' },
        { status: 400 }
      );
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { success: false, error: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Check if sender is blocked by receiver
    const block = await prisma.block.findUnique({
      where: {
        issuerId_receiverId: {
          issuerId: receiverId,
          receiverId: auth.userId,
        },
      },
    });

    if (block) {
      return NextResponse.json(
        { success: false, error: 'Unable to send bro' },
        { status: 403 }
      );
    }

    // Check for spam/suspicious activity
    const spamCheck = await flagSuspiciousActivity(auth.userId, 'rapid_sending');
    if (spamCheck.isFlagged && spamCheck.severity > 3) {
      return NextResponse.json(
        { success: false, error: 'Suspicious activity detected. Please slow down.' },
        { status: 429 }
      );
    }

    // Create the bro
    const bro = await prisma.bro.create({
      data: {
        senderId: auth.userId,
        receiverId,
        type: type as BroType,
        message: message || undefined,
        isAnonymous: isAnonymous || false,
        status: 'PENDING',
        reactionCount: 0,
        engagementScore: 0,
      },
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
      },
    });

    // Update sender's streak with receiver
    const streak = await updateStreak(auth.userId, receiverId);

    // Record interaction for ML
    await recordInteraction(auth.userId, receiverId, 'BRO_SENT', type as BroType);

    // Update personality profile
    await updatePersonalityProfile(auth.userId, 'BRO_SENT', type as BroType);

    // Create notification for receiver
    await createNotification({
      userId: receiverId,
      type: 'NEW_BRO',
      title: isAnonymous ? 'You received an anonymous bro!' : `You received a bro from ${bro.sender.displayName || bro.sender.username}!`,
      message: isAnonymous
        ? 'Someone sent you a bro. Can you guess who?'
        : `${bro.sender.displayName || bro.sender.username} sent you a ${type.toLowerCase()} bro!`,
      broId: bro.id,
      senderId: isAnonymous ? undefined : auth.userId,
    });

    return NextResponse.json({
      success: true,
      data: { bro, streak },
      message: 'Bro sent successfully',
    });
  } catch (error) {
    console.error('Send bro error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send bro' },
      { status: 500 }
    );
  }
}
