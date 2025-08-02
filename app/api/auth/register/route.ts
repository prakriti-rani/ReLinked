import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import validator from 'validator';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: NextRequest) => req.ip || 'anonymous',
  points: 5, // Number of requests
  duration: 60, // Per 60 seconds
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    try {
      await rateLimiter.consume(request.ip || 'anonymous');
    } catch (rateLimitReached) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { name, email, password } = await request.json();

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!validator.isEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!validator.isStrongPassword(password, { minSymbols: 0 })) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' },
        { status: 400 }
      );
    }

    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again.' },
        { status: 503 }
      );
    }

    // Check if user already exists
    const existingUser = await (User as any).findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await user.save();

    return NextResponse.json(
      { message: 'User created successfully', userId: user._id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
