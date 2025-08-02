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
    const dbConnection = await connectDB();
    if (!dbConnection) {
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
    
    const { shortCode } = params;
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Find the URL
    const urlDoc = await (Url as any).findOne({ shortCode });

    if (!urlDoc) {
      return NextResponse.json({ error: 'URL not found' }, { status: 404 });
    }

    // Check if URL is expired
    if (urlDoc.expiresAt && new Date() > urlDoc.expiresAt) {
      return NextResponse.json({ error: 'URL has expired' }, { status: 410 });
    }

    // Check if URL is active
    if (!urlDoc.isActive) {
      return NextResponse.json({ error: 'URL is disabled' }, { status: 403 });
    }

    // Check password protection
    if (urlDoc.password) {
      if (!password) {
        return NextResponse.json({ 
          error: 'Password required',
          requiresPassword: true,
          shortCode
        }, { status: 401 });
      }
      
      if (password !== urlDoc.password) {
        return NextResponse.json({ 
          error: 'Invalid password',
          requiresPassword: true,
          shortCode
        }, { status: 401 });
      }
    }

    // Track analytics
    const userAgent = request.headers.get('user-agent') || '';
    const referer = request.headers.get('referer') || '';
    const ip = request.ip || 
              request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown';

    // Parse user agent for device info (simple parsing)
    const device = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'Mobile' : 'Desktop';
    const browser = userAgent.includes('Chrome') ? 'Chrome' : 
                   userAgent.includes('Firefox') ? 'Firefox' : 
                   userAgent.includes('Safari') ? 'Safari' : 
                   userAgent.includes('Edge') ? 'Edge' : 'Other';
    const os = userAgent.includes('Windows') ? 'Windows' : 
              userAgent.includes('Mac') ? 'macOS' : 
              userAgent.includes('Linux') ? 'Linux' : 
              userAgent.includes('Android') ? 'Android' : 
              userAgent.includes('iOS') ? 'iOS' : 'Other';

    // Save analytics
    try {
      const analytics = new Analytics({
        urlId: urlDoc._id,
        ip,
        userAgent,
        referer,
        device,
        browser,
        os,
        country: 'Unknown', // You can integrate with IP geolocation service
        timestamp: new Date(),
      });
      await analytics.save();

      // Update click count
      await (Url as any).findByIdAndUpdate(urlDoc._id, { $inc: { clicks: 1 } });
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
      // Continue with redirect even if analytics fails
    }

    // Redirect to original URL
    return NextResponse.redirect(urlDoc.originalUrl);

  } catch (error) {
    console.error('URL redirect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
