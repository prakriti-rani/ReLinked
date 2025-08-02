import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Analytics from '@/models/Analytics';
import Url from '@/models/Url';
import { authOptions } from '@/lib/auth';

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

    await connectDB();

    const urlId = params.id;

    // Verify URL belongs to user
    const urlDoc = await (Url as any).findOne({ _id: urlId, userId: session.user.id });
    if (!urlDoc) {
      return NextResponse.json(
        { error: 'URL not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, all
    
    let dateFilter = {};
    const now = new Date();
    
    // Convert to IST for proper date filtering
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const nowIST = new Date(now.getTime() + istOffset);
    
    switch (period) {
      case '7d':
        const sevenDaysAgo = new Date(nowIST.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = { timestamp: { $gte: new Date(sevenDaysAgo.getTime() - istOffset) } };
        break;
      case '30d':
        const thirtyDaysAgo = new Date(nowIST.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = { timestamp: { $gte: new Date(thirtyDaysAgo.getTime() - istOffset) } };
        break;
      case '90d':
        const ninetyDaysAgo = new Date(nowIST.getTime() - 90 * 24 * 60 * 60 * 1000);
        dateFilter = { timestamp: { $gte: new Date(ninetyDaysAgo.getTime() - istOffset) } };
        break;
      default:
        // All time
        break;
    }

    // Get analytics data
    const analytics = await (Analytics as any).find(
      { urlId, ...dateFilter },
      undefined,
      undefined
    ).sort({ timestamp: -1 });

    // Aggregate data for charts
    const deviceStats = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const browserStats = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const osStats = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const countryStats = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Daily clicks for chart
    const dailyClicks = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
            month: { $month: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
            day: { $dayOfMonth: { date: '$timestamp', timezone: 'Asia/Kolkata' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Hourly clicks for more detailed view
    const hourlyClicks = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
            month: { $month: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
            day: { $dayOfMonth: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
            hour: { $hour: { date: '$timestamp', timezone: 'Asia/Kolkata' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 } }
    ]);

    // Weekly clicks aggregation
    const weeklyClicks = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      {
        $group: {
          _id: {
            year: { $year: { date: '$timestamp', timezone: 'Asia/Kolkata' } },
            week: { $week: { date: '$timestamp', timezone: 'Asia/Kolkata' } }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ]);

    // Peak hours analysis
    const peakHours = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      {
        $group: {
          _id: { hour: { $hour: { date: '$timestamp', timezone: 'Asia/Kolkata' } } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.hour': 1 } }
    ]);

    // Referrer stats
    const referrerStats = await (Analytics as any).aggregate([
      { $match: { urlId: urlDoc._id, ...dateFilter } },
      { 
        $group: { 
          _id: { 
            $cond: {
              if: { $eq: ['$referer', ''] },
              then: 'Direct',
              else: {
                $cond: {
                  if: { $regexMatch: { input: '$referer', regex: /^https?:\/\/([^\/]+)/ } },
                  then: { 
                    $arrayElemAt: [
                      { $split: [{ $arrayElemAt: [{ $split: ['$referer', '//'] }, 1] }, '/'] }, 
                      0
                    ] 
                  },
                  else: 'Unknown'
                }
              }
            }
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      url: {
        id: urlDoc._id,
        originalUrl: urlDoc.originalUrl,
        shortCode: urlDoc.shortCode,
        totalClicks: urlDoc.clicks,
        createdAt: urlDoc.createdAt,
      },
      analytics: {
        totalClicks: analytics.length,
        uniqueClicks: new Set(analytics.map(a => a.ip)).size,
        period,
        charts: {
          dailyClicks: dailyClicks.map(item => ({
            date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
            clicks: item.count
          })),
          hourlyClicks: hourlyClicks.map(item => ({
            datetime: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')} ${String(item._id.hour).padStart(2, '0')}:00`,
            hour: item._id.hour,
            clicks: item.count
          })),
          weeklyClicks: weeklyClicks.map(item => ({
            week: `${item._id.year}-W${String(item._id.week).padStart(2, '0')}`,
            clicks: item.count
          })),
          peakHours: peakHours.map(item => ({
            hour: item._id.hour,
            clicks: item.count
          })),
          devices: deviceStats.map(item => ({ name: item._id || 'Unknown', value: item.count })),
          browsers: browserStats.map(item => ({ name: item._id || 'Unknown', value: item.count })),
          os: osStats.map(item => ({ name: item._id || 'Unknown', value: item.count })),
          countries: countryStats.map(item => ({ name: item._id || 'Unknown', value: item.count })),
          referrers: referrerStats.map(item => ({ name: item._id || 'Unknown', value: item.count })),
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
