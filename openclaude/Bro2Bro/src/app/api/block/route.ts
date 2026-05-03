import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';

// POST - Block a user
export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { userId, reason } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        issuerId_receiverId: {
          issuerId: auth.userId,
          receiverId: userId,
        },
      },
    });

    if (existingBlock) {
      return NextResponse.json(
        { success: false, error: 'User already blocked' },
        { status: 409 }
      );
    }

    // Create block
    const block = await prisma.block.create({
      data: {
        issuerId: auth.userId,
        receiverId: userId,
      },
    });

    // Delete any existing streak
    await prisma.streak.deleteMany({
      where: {
        OR: [
          { user1Id: auth.userId, user2Id: userId },
          { user1Id: userId, user2Id: auth.userId },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      data: { block },
      message: 'User blocked successfully',
    });
  } catch (error) {
    console.error('Block user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to block user' },
      { status: 500 }
    );
  }
}

// GET - Get blocked users list
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const blocks = await prisma.block.findMany({
      where: { issuerId: auth.userId },
      include: {
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { blocks },
    });
  } catch (error) {
    console.error('Get blocks error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get blocked users' },
      { status: 500 }
    );
  }
}

// DELETE - Unblock a user
export async function DELETE(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    await prisma.block.deleteMany({
      where: {
        issuerId: auth.userId,
        receiverId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error) {
    console.error('Unblock user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}
