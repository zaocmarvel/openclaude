import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireApiAuth } from '@/lib/auth';

// POST - Report a user
export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { userId, category, reason, broId } = await req.json();

    // Validation
    if (!userId || !category) {
      return NextResponse.json(
        { success: false, error: 'User ID and category are required' },
        { status: 400 }
      );
    }

    if (!['HARASSMENT', 'SPAM', 'INAPPROPRIATE_CONTENT', 'FAKE_ACCOUNT', 'OTHER'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid category' },
        { status: 400 }
      );
    }

    if (userId === auth.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot report yourself' },
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

    // Check if already reported
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: auth.userId,
        targetType: 'USER',
        targetId: userId,
        status: 'PENDING',
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending report for this user' },
        { status: 409 }
      );
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        reporterId: auth.userId,
        targetType: 'USER',
        targetId: userId,
        reason,
        description: category,
        broId,
        status: 'PENDING',
      },
    });

    // Check if user has multiple reports and auto-flag if needed
    const reportCount = await prisma.report.count({
      where: {
        targetType: 'USER',
        targetId: userId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    if (reportCount >= 3) {
      // Auto-flag for review
      await prisma.safetyFlag.create({
        data: {
          userId,
          type: 'SUSPICIOUS_ACTIVITY',
          severity: Math.min(reportCount, 5),
          description: `User has ${reportCount} reports in the last 7 days`,
          evidence: JSON.stringify({ reportId: report.id, category }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { report },
      message: 'Report submitted successfully',
    });
  } catch (error) {
    console.error('Create report error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit report' },
      { status: 500 }
    );
  }
}

// GET - Get user's own reports
export async function GET(req: NextRequest) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: auth.userId },
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: { reports },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get reports' },
      { status: 500 }
    );
  }
}
