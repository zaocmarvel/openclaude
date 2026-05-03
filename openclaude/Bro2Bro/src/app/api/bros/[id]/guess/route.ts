import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';
import { createNotification } from '@/lib/services/notifications';

// POST - Guess who sent an anonymous bro
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const { guessedUserId } = await req.json();

    if (!guessedUserId) {
      return NextResponse.json(
        { success: false, error: 'Guessed user ID is required' },
        { status: 400 }
      );
    }

    // Get the bro
    const bro = await prisma.bro.findUnique({
      where: { id },
      include: {
        sender: true,
        guessAttempts: true,
      },
    });

    if (!bro) {
      return NextResponse.json(
        { success: false, error: 'Bro not found' },
        { status: 404 }
      );
    }

    // Check if bro is anonymous
    if (!bro.isAnonymous) {
      return NextResponse.json(
        { success: false, error: 'This bro is not anonymous' },
        { status: 400 }
      );
    }

    // Check if user is the receiver
    if (bro.receiverId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Only the receiver can guess' },
        { status: 403 }
      );
    }

    // Check if already revealed
    if (bro.revealedAt) {
      return NextResponse.json(
        { success: false, error: 'Sender already revealed' },
        { status: 400 }
      );
    }

    // Check if user already guessed correctly
    const existingCorrectGuess = bro.guessAttempts.find(
      g => g.userId === auth.userId && g.isCorrect
    );

    if (existingCorrectGuess) {
      return NextResponse.json({
        success: true,
        data: {
          isCorrect: true,
          sender: bro.sender,
          alreadyGuessed: true,
        },
        message: 'You already guessed correctly!',
      });
    }

    // Check the guess
    const isCorrect = bro.senderId === guessedUserId;

    // Record the guess attempt
    await prisma.guessAttempt.create({
      data: {
        broId: id,
        userId: auth.userId,
        guessedUserId,
        isCorrect,
      },
    });

    // If correct, reveal the sender
    if (isCorrect) {
      await prisma.bro.update({
        where: { id },
        data: {
          revealedAt: new Date(),
          guessedCorrectly: true,
        },
      });

      // Notify sender that they were guessed
      await createNotification({
        userId: bro.senderId,
        type: 'GUESS_RESULT',
        title: 'Your identity was revealed!',
        message: `${bro.receiver?.displayName || 'Someone'} correctly guessed that you sent them a bro!`,
        broId: id,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        sender: isCorrect ? bro.sender : null,
      },
      message: isCorrect ? 'Correct guess! The sender has been revealed.' : 'Wrong guess. Try again!',
    });
  } catch (error) {
    console.error('Guess error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process guess' },
      { status: 500 }
    );
  }
}

// GET - Get remaining guesses for a bro
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

    if (bro.receiverId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const guessCount = bro.guessAttempts.length;
    const maxGuesses = 3;
    const isRevealed = bro.revealedAt !== null || guessCount >= maxGuesses;

    return NextResponse.json({
      success: true,
      data: {
        guessCount,
        maxGuesses,
        remainingGuesses: Math.max(0, maxGuesses - guessCount),
        isRevealed,
        sender: isRevealed ? bro.sender : null,
        guessedCorrectly: bro.guessedCorrectly,
      },
    });
  } catch (error) {
    console.error('Get guess status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get guess status' },
      { status: 500 }
    );
  }
}
