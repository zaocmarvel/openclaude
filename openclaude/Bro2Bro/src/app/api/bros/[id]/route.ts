import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';

// GET - Get a specific bro by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const bro = await prisma.bro.findUnique({
      where: { id },
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
        guessAttempts: {
          where: { userId: auth.userId },
        },
      },
    });

    if (!bro) {
      return NextResponse.json(
        { success: false, error: 'Bro not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to view this bro
    if (bro.senderId !== auth.userId && bro.receiverId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Mark as viewed if receiver is viewing
    if (bro.receiverId === auth.userId && bro.status === 'PENDING') {
      await prisma.bro.update({
        where: { id },
        data: {
          status: 'VIEWED',
          viewedAt: new Date(),
        },
      });
    }

    // Hide sender info if anonymous and not revealed
    const isRevealed = bro.revealedAt !== null || bro.senderId === auth.userId;
    const responseBro = {
      ...bro,
      sender: bro.isAnonymous && !isRevealed ? null : bro.sender,
    };

    return NextResponse.json({
      success: true,
      data: { bro: responseBro },
    });
  } catch (error) {
    console.error('Get bro error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get bro' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bro (only sender can delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const bro = await prisma.bro.findUnique({
      where: { id },
    });

    if (!bro) {
      return NextResponse.json(
        { success: false, error: 'Bro not found' },
        { status: 404 }
      );
    }

    if (bro.senderId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the sender can delete a bro' },
        { status: 403 }
      );
    }

    await prisma.bro.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Bro deleted successfully',
    });
  } catch (error) {
    console.error('Delete bro error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete bro' },
      { status: 500 }
    );
  }
}
