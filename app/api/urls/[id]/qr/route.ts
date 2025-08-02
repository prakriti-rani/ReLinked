import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import QRCode from 'qrcode';
import connectDB from '@/lib/mongodb';
import Url from '@/models/Url';
import { authOptions } from '@/lib/auth';

export async function POST(
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

    // Find URL belonging to user
    const urlDoc = await (Url as any).findOne({ 
      _id: params.id, 
      userId: session.user.id 
    });

    if (!urlDoc) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    // Generate QR code
    const shortUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/${urlDoc.shortCode}`;
    
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Update URL document with QR code
    urlDoc.qrCode = qrCodeDataUrl;
    await urlDoc.save();

    return NextResponse.json({
      success: true,
      qrCode: qrCodeDataUrl
    });

  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
