import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Url from '@/models/Url';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all URLs for the user
    const urls = await Url.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    if (!urls || urls.length === 0) {
      return NextResponse.json({
        totalUrls: 0,
        totalClicks: 0,
        avgClicksPerUrl: 0,
        topPerformingUrls: [],
        recentActivity: []
      });
    }

    // Calculate overview statistics
    const totalUrls = urls.length;
    const totalClicks = urls.reduce((sum, url) => sum + (url.clicks || 0), 0);
    const avgClicksPerUrl = totalClicks / totalUrls;

    // Get top performing URLs (sorted by clicks, top 5)
    const topPerformingUrls = [...urls]
      .filter(url => url.clicks > 0)
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5)
      .map(url => ({
        _id: url._id.toString(),
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        clicks: url.clicks || 0,
        lastClicked: url.lastClicked,
        createdAt: url.createdAt,
        title: url.title
      }));

    // Get recent activity (URLs with recent clicks or newly created, top 5)
    const recentActivity = [...urls]
      .filter(url => url.lastClicked || url.createdAt)
      .sort((a, b) => {
        const aDate = new Date(a.lastClicked || a.createdAt);
        const bDate = new Date(b.lastClicked || b.createdAt);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 5)
      .map(url => ({
        _id: url._id.toString(),
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        clicks: url.clicks || 0,
        lastClicked: url.lastClicked,
        createdAt: url.createdAt,
        title: url.title
      }));

    return NextResponse.json({
      totalUrls,
      totalClicks,
      avgClicksPerUrl: Math.round(avgClicksPerUrl * 10) / 10, // Round to 1 decimal
      topPerformingUrls,
      recentActivity
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}
