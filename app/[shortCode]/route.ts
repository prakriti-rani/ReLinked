import { NextRequest, NextResponse } from 'next/server';

// Build-time safety check
const IS_BUILD_TIME = (() => {
  try {
    return process.env.NEXT_PHASE === 'phase-production-build' ||
           (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI);
  } catch {
    return false;
  }
})();

// Conditional imports to avoid build-time issues
let connectDB: any = null;
let Url: any = null;
let Analytics: any = null;

if (!IS_BUILD_TIME) {
  connectDB = require('@/lib/mongodb').default;
  Url = require('@/models/Url').default;
  Analytics = require('@/models/Analytics').default;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  // Early return during build time
  if (IS_BUILD_TIME) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  try {
    // Connect to database with error handling
    const dbConnection = await connectDB();
    if (!dbConnection) {
      // During build time, return a placeholder response
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }

    const shortCode = params.shortCode;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');
    
    // Find the URL
    const urlDoc = await (Url as any).findOne({ 
      $and: [
        {
          $or: [
            { shortCode },
            { customAlias: shortCode }
          ]
        },
        { isActive: true }
      ]
    });

    if (!urlDoc) {
      return NextResponse.redirect(new URL('/404', request.url));
    }

    // Check if URL is expired
    if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
      return NextResponse.redirect(new URL('/expired', request.url));
    }

    // Check password protection
    if (urlDoc.password) {
      if (!password) {
        // Redirect to password form page
        return NextResponse.redirect(new URL(`/password/${shortCode}`, request.url));
      }
      
      if (password !== urlDoc.password) {
        // Redirect back to password form with error
        return NextResponse.redirect(new URL(`/password/${shortCode}?error=invalid`, request.url));
      }
    }

    // Track analytics
    try {
      const userAgent = request.headers.get('user-agent') || '';
      const referer = request.headers.get('referer') || '';
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';

      // Simple device detection
      let device = 'unknown';
      if (userAgent.includes('Mobile')) device = 'mobile';
      else if (userAgent.includes('Tablet')) device = 'tablet';
      else if (userAgent.includes('Windows') || userAgent.includes('Mac') || userAgent.includes('Linux')) device = 'desktop';

      // Simple browser detection
      let browser = 'unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      // Simple OS detection
      let os = 'unknown';
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS')) os = 'iOS';

      // Create analytics record
      const analytics = new Analytics({
        urlId: urlDoc._id,
        ip,
        userAgent,
        referer,
        device,
        browser,
        os,
      });

      await analytics.save();

      // Update click count
      await (Url as any).findByIdAndUpdate(
        urlDoc._id,
        { 
          $inc: { clicks: 1 },
          updatedAt: new Date()
        }
      );

    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
      // Continue with redirect even if analytics fails
    }

    // Redirect to original URL
    return NextResponse.redirect(urlDoc.originalUrl, { status: 302 });

  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL('/error', request.url));
  }
}
