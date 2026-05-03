import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, isStrongPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, username, displayName } = await req.json();

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json(
        { success: false, error: 'Email, password, and username are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { success: false, error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    // Check password strength
    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.isStrong) {
      return NextResponse.json(
        { success: false, error: passwordCheck.errors.join(', ') },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Check if username exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        handle: username.toLowerCase(),
        displayName: displayName || username,
        password: hashedPassword,
        onboardingCompleted: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        image: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { user },
        message: 'Account created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
