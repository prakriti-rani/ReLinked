import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Url from '@/models/Url';
import Analytics from '@/models/Analytics';

export async function GET(
  request: NextRequest,
  { params }: { params: { shortCode: string } }
) {
  try {
    await connectDB();
    
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
