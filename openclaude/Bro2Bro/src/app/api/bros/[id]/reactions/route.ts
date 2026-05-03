import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';
import { checkRateLimit, recordInteraction } from '@/lib/safety/rate-limit';
import { createNotification } from '@/lib/services/notifications';
import { updateStreak } from '@/lib/services/streaks';
import { NotificationType } from '@prisma/client';

// POST - Add a reaction to a bro
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    // Check rate limit
    const rateLimit = await checkRateLimit(auth.userId, 'reaction');
    if (rateLimit.isLimited) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const { id } = await params;
    const { type } = await req.json();

    // Validate reaction type
    if (!['BRO_BACK', 'LAUGH', 'IGNORE'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reaction type' },
        { status: 400 }
      );
    }

    // Get the bro
    const bro = await prisma.bro.findUnique({
      where: { id },
      include: {
        sender: true,
        receiver: true,
        reactions: true,
      },
    });

    if (!bro) {
      return NextResponse.json(
        { success: false, error: 'Bro not found' },
        { status: 404 }
      );
    }

    // Check if user is the receiver
    if (bro.receiverId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the receiver can react to a bro' },
        { status: 403 }
      );
    }

    // Check for existing reaction
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        broId: id,
        userId: auth.userId,
      },
    });

    // Upsert reaction (update if exists, create if not)
    const reaction = await prisma.reaction.upsert({
      where: {
        userId_broId_type: {
          userId: auth.userId,
          broId: id,
          type: existingReaction?.type || type,
        },
      },
      update: {
        type,
      },
      create: {
        broId: id,
        userId: auth.userId,
        type,
      },
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
    });

    // Update bro status and reaction count
    const isNewReaction = !bro.reactions?.find(r => r.userId === auth.userId);
    await prisma.bro.update({
      where: { id },
      data: {
        status: 'VIEWED',
        reactionCount: isNewReaction ? { increment: 1 } : undefined,
      },
    });

    // Handle BRO_BACK reaction - create reciprocal bro if appropriate
    let streak = null;
    if (type === 'BRO_BACK') {
      streak = await updateStreak(auth.userId, bro.senderId);

      // Record interaction
      await recordInteraction(auth.userId, bro.senderId, 'REACTION_SENT', undefined, true);

      // Send notification to original sender
      await createNotification({
        userId: bro.senderId,
        type: 'POST_LIKE' as NotificationType,
        title: `${bro.receiver.displayName || bro.receiver.username} bro'd you back!`,
        message: 'Your bro got a reaction! Keep the streak going!',
        broId: id,
        senderId: auth.userId,
      });
    }

    return NextResponse.json({
      success: true,
      data: { reaction, streak },
      message: 'Reaction added successfully',
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a reaction
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    await prisma.reaction.deleteMany({
      where: {
        broId: id,
        userId: auth.userId,
      },
    });

    // Decrement reaction count
    await prisma.bro.update({
      where: { id },
      data: {
        reactionCount: { decrement: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Reaction removed successfully',
    });
  } catch (error) {
    console.error('Remove reaction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove reaction' },
      { status: 500 }
    );
  }
}
