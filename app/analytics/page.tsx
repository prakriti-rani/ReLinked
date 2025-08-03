'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { motion } from 'framer-motion';
import { BarChart3, Eye, MousePointer, Globe, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface UrlData {
  _id: string;
  shortCode: string;
  originalUrl: string;
  clicks: number;
  lastClicked?: string;
  createdAt: string;
  title?: string;
}

interface AnalyticsOverview {
  totalUrls: number;
  totalClicks: number;
  avgClicksPerUrl: number;
  topPerformingUrls: UrlData[];
  recentActivity: UrlData[];
}

export default function AnalyticsOverview() {
  const { data: session, status } = useSession();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchOverview();
    }
  }, [session]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/overview');
      if (!response.ok) throw new Error('Failed to fetch analytics overview');
      
      const data = await response.json();
      setOverview(data);
    } catch (err) {
      setError('Failed to load analytics overview');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="card text-center">
            <div className="text-red-500 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Analytics</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={fetchOverview} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Overview</h1>
          <p className="text-gray-600">Comprehensive insights into your URL performance</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="card text-center">
            <div className="text-blue-500 mb-3">
              <Globe className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{overview.totalUrls}</div>
            <div className="text-sm text-gray-600">Total URLs</div>
          </div>

          <div className="card text-center">
            <div className="text-green-500 mb-3">
              <MousePointer className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{overview.totalClicks}</div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>

          <div className="card text-center">
            <div className="text-purple-500 mb-3">
              <TrendingUp className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{overview.avgClicksPerUrl.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Clicks/URL</div>
          </div>

          <div className="card text-center">
            <div className="text-orange-500 mb-3">
              <Eye className="h-8 w-8 mx-auto" />
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {overview.recentActivity.length}
            </div>
            <div className="text-sm text-gray-600">Recent Activity</div>
          </div>
        </motion.div>

        {/* Top Performing URLs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Top Performing URLs
            </h2>
            <div className="space-y-3">
              {overview.topPerformingUrls.length > 0 ? (
                overview.topPerformingUrls.map((url, index) => (
                  <Link
                    key={url._id}
                    href={`/analytics/${url.shortCode}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className="text-sm font-medium text-blue-600 truncate">
                            /{url.shortCode}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-1">{url.originalUrl}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">{url.clicks}</div>
                        <div className="text-xs text-gray-500">clicks</div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MousePointer className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No click data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {overview.recentActivity.length > 0 ? (
                overview.recentActivity.map((url) => (
                  <Link
                    key={url._id}
                    href={`/analytics/${url.shortCode}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-blue-600 truncate">
                          /{url.shortCode}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{url.originalUrl}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{url.clicks}</div>
                        <div className="text-xs text-gray-500">
                          {url.lastClicked 
                            ? new Date(url.lastClicked).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
                            : 'Never'
                          }
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Back to Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link href="/dashboard" className="btn-secondary">
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
