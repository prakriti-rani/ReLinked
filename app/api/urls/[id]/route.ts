import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Url from '@/models/Url';
import Analytics from '@/models/Analytics';
import { authOptions } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const urlId = params.id;

    // Verify URL belongs to user
    const urlDoc = await (Url as any).findOne({ _id: urlId, userId: session.user.id });
    if (!urlDoc) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    // Delete analytics data first
    await (Analytics as any).deleteMany({ urlId });

    // Delete the URL
    await (Url as any).findByIdAndDelete(urlId);

    return NextResponse.json({ message: 'URL deleted successfully' });

  } catch (error) {
    console.error('Delete URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const urlId = params.id;

    // Verify URL belongs to user and get details
    const urlDoc = await (Url as any).findOne({ _id: urlId, userId: session.user.id });
    if (!urlDoc) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: {
        id: urlDoc._id,
        originalUrl: urlDoc.originalUrl,
        shortCode: urlDoc.shortCode,
        customAlias: urlDoc.customAlias,
        clicks: urlDoc.clicks,
        createdAt: urlDoc.createdAt,
        metadata: urlDoc.metadata,
      }
    });

  } catch (error) {
    console.error('Get URL error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
