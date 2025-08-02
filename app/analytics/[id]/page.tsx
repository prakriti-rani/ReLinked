'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  BarChart3, 
  Users, 
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  ExternalLink,
  Eye,
  TrendingUp,
  Share2
} from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js'
import { Bar, Line, Doughnut, Radar } from 'react-chartjs-2'
import { formatDateIST, formatTimeIST, DateFormats } from '@/lib/timezone'
import Navbar from '@/components/Navbar'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
)

interface AnalyticsData {
  url: {
    id: string
    originalUrl: string
    shortCode: string
    totalClicks: number
    createdAt: string
  }
  analytics: {
    totalClicks: number
    uniqueClicks: number
    period: string
    charts: {
      dailyClicks: Array<{ date: string; clicks: number }>
      hourlyClicks: Array<{ datetime: string; hour: number; clicks: number }>
      weeklyClicks: Array<{ week: string; clicks: number }>
      peakHours: Array<{ hour: number; clicks: number }>
      devices: Array<{ name: string; value: number }>
      browsers: Array<{ name: string; value: number }>
      os: Array<{ name: string; value: number }>
      countries: Array<{ name: string; value: number }>
      referrers: Array<{ name: string; value: number }>
    }
  }
}

export default function AnalyticsPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('7d')
  const [chartType, setChartType] = useState<'daily' | 'hourly' | 'peakHours'>('daily')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchAnalytics()
    }
  }, [status, router, period])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics/${params.id}?period=${period}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Analytics not found</h1>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        display: true,
        title: {
          display: true,
          text: chartType === 'hourly' ? 'Time' : chartType === 'peakHours' ? 'Hour of Day' : 'Date'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            const hour = context[0].label
            const hourNum = parseInt(hour.split(':')[0])
            if (hourNum >= 0 && hourNum < 6) return `${hour} (Night)`
            if (hourNum >= 6 && hourNum < 12) return `${hour} (Morning)`
            if (hourNum >= 12 && hourNum < 18) return `${hour} (Afternoon)`
            return `${hour} (Evening)`
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      x: {
        title: {
          display: true,
          text: 'Hour of Day'
        }
      }
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  const dailyClicksData = {
    labels: data.analytics.charts.dailyClicks.map(item => 
      formatDateIST(item.date, DateFormats.short)
    ),
    datasets: [
      {
        label: 'Clicks',
        data: data.analytics.charts.dailyClicks.map(item => item.clicks),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const hourlyClicksData = {
    labels: data.analytics.charts.hourlyClicks.map(item => 
      formatTimeIST(item.datetime, { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit',
        minute: '2-digit'
      })
    ),
    datasets: [
      {
        label: 'Hourly Clicks',
        data: data.analytics.charts.hourlyClicks.map(item => item.clicks),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  }

  const peakHoursData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Clicks by Hour',
        data: Array.from({ length: 24 }, (_, hour) => {
          const hourData = data.analytics.charts.peakHours.find(p => p.hour === hour)
          return hourData ? hourData.clicks : 0
        }),
        backgroundColor: [
          ...Array(6).fill('rgba(99, 102, 241, 0.3)'), // 0-5 AM (purple - night)
          ...Array(6).fill('rgba(245, 158, 11, 0.5)'), // 6-11 AM (amber - morning)
          ...Array(6).fill('rgba(59, 130, 246, 0.7)'), // 12-17 PM (blue - afternoon)
          ...Array(6).fill('rgba(139, 92, 246, 0.5)'), // 18-23 PM (violet - evening)
        ],
        borderColor: [
          ...Array(6).fill('rgba(99, 102, 241, 1)'),
          ...Array(6).fill('rgba(245, 158, 11, 1)'),
          ...Array(6).fill('rgba(59, 130, 246, 1)'),
          ...Array(6).fill('rgba(139, 92, 246, 1)'),
        ],
        borderWidth: 1,
      },
    ],
  }

  const deviceData = {
    labels: data.analytics.charts.devices.map(item => item.name),
    datasets: [
      {
        data: data.analytics.charts.devices.map(item => item.value),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
        ],
      },
    ],
  }

  const browserData = {
    labels: data.analytics.charts.browsers.map(item => item.name),
    datasets: [
      {
        data: data.analytics.charts.browsers.map(item => item.value),
        backgroundColor: [
          '#3B82F6',
          '#EF4444',
          '#10B981',
          '#F59E0B',
          '#8B5CF6',
          '#EC4899',
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Short URL: <span className="font-medium">relinked.app/{data.url.shortCode}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Original URL: 
                    <a 
                      href={data.url.originalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      {data.url.originalUrl.length > 50 
                        ? data.url.originalUrl.substring(0, 50) + '...' 
                        : data.url.originalUrl
                      }
                      <ExternalLink className="inline h-3 w-3 ml-1" />
                    </a>
                  </p>
                </div>
              </div>

              {/* Period Selector */}
              <div className="flex space-x-4">
                {/* Chart Type Selector */}
                <div className="flex bg-white rounded-lg shadow-sm border">
                  {[
                    { value: 'daily', label: 'Daily', icon: Calendar },
                    { value: 'hourly', label: 'Hourly', icon: TrendingUp },
                    { value: 'peakHours', label: 'Peak Hours', icon: BarChart3 },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setChartType(option.value as any)}
                      className={`px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-1 ${
                        chartType === option.value
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      } ${option.value === 'daily' ? 'rounded-l-lg' : ''} ${
                        option.value === 'peakHours' ? 'rounded-r-lg' : ''
                      }`}
                    >
                      <option.icon className="h-4 w-4" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>

                {/* Period Selector */}
                <div className="flex bg-white rounded-lg shadow-sm border">
                {[
                  { value: '7d', label: '7D' },
                  { value: '30d', label: '30D' },
                  { value: '90d', label: '90D' },
                  { value: 'all', label: 'All Time' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPeriod(option.value)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      period === option.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    } ${option.value === '7d' ? 'rounded-l-lg' : ''} ${
                      option.value === 'all' ? 'rounded-r-lg' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
                </div>
              </div>
            </div>
          </div>          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">{data.analytics.totalClicks}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card"
            >
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                  <p className="text-2xl font-bold text-gray-900">{data.analytics.uniqueClicks}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card"
            >
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.analytics.uniqueClicks > 0 
                      ? Math.round((data.analytics.totalClicks / data.analytics.uniqueClicks) * 100) / 100
                      : 0
                    }
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card"
            >
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatDateIST(data.url.createdAt, DateFormats.long)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Clicks Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  {chartType === 'daily' && <Calendar className="h-5 w-5 mr-2" />}
                  {chartType === 'hourly' && <TrendingUp className="h-5 w-5 mr-2" />}
                  {chartType === 'peakHours' && <BarChart3 className="h-5 w-5 mr-2" />}
                  {chartType === 'daily' && 'Daily Clicks'}
                  {chartType === 'hourly' && 'Hourly Click Patterns'}
                  {chartType === 'peakHours' && 'Peak Hours Analysis'}
                </h3>
                <div className="text-sm text-gray-500">
                  {chartType === 'daily' && 'Click trends by day'}
                  {chartType === 'hourly' && 'Detailed hourly breakdown'}
                  {chartType === 'peakHours' && 'Best performing hours'}
                </div>
              </div>
              <div className="h-64">
                {(() => {
                  if (chartType === 'daily' && data.analytics.charts.dailyClicks.length > 0) {
                    return <Line data={dailyClicksData} options={lineChartOptions} />
                  } else if (chartType === 'hourly' && data.analytics.charts.hourlyClicks.length > 0) {
                    return <Line data={hourlyClicksData} options={lineChartOptions} />
                  } else if (chartType === 'peakHours' && data.analytics.charts.peakHours.length > 0) {
                    return <Bar data={peakHoursData} options={barChartOptions} />
                  } else {
                    return (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          {chartType === 'daily' && <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />}
                          {chartType === 'hourly' && <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />}
                          {chartType === 'peakHours' && <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />}
                          <p>No {chartType} data available for this period</p>
                          <p className="text-sm">Data will appear as users interact with your link</p>
                        </div>
                      </div>
                    )
                  }
                })()}
              </div>
              
              {/* Chart insights */}
              {chartType === 'peakHours' && data.analytics.charts.peakHours.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-600">🌙 Night (0-5AM)</div>
                      <div className="font-semibold text-purple-600">
                        {data.analytics.charts.peakHours
                          .filter(h => h.hour >= 0 && h.hour < 6)
                          .reduce((sum, h) => sum + h.clicks, 0)} clicks
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">🌅 Morning (6-11AM)</div>
                      <div className="font-semibold text-amber-600">
                        {data.analytics.charts.peakHours
                          .filter(h => h.hour >= 6 && h.hour < 12)
                          .reduce((sum, h) => sum + h.clicks, 0)} clicks
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">☀️ Afternoon (12-5PM)</div>
                      <div className="font-semibold text-blue-600">
                        {data.analytics.charts.peakHours
                          .filter(h => h.hour >= 12 && h.hour < 18)
                          .reduce((sum, h) => sum + h.clicks, 0)} clicks
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">🌆 Evening (6-11PM)</div>
                      <div className="font-semibold text-violet-600">
                        {data.analytics.charts.peakHours
                          .filter(h => h.hour >= 18 && h.hour < 24)
                          .reduce((sum, h) => sum + h.clicks, 0)} clicks
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Device Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Smartphone className="h-5 w-5 mr-2" />
                Devices
              </h3>
              <div className="h-64">
                {data.analytics.charts.devices.length > 0 ? (
                  <Doughnut data={deviceData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Smartphone className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No device data available</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Browser Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Browsers
              </h3>
              <div className="h-64">
                {data.analytics.charts.browsers.length > 0 ? (
                  <Doughnut data={browserData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Globe className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No browser data available</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Countries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Top Countries
              </h3>
              <div className="space-y-3">
                {data.analytics.charts.countries.length > 0 ? (
                  data.analytics.charts.countries.slice(0, 5).map((country, index) => (
                    <div key={country.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <span className="text-sm text-gray-700">{country.name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${data.analytics.charts.countries[0] ? (country.value / data.analytics.charts.countries[0].value) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {country.value}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Globe className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No location data available</p>
                    <p className="text-sm">Country information will appear as users visit your link</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Traffic Sources */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="card"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Share2 className="h-5 w-5 mr-2" />
                Traffic Sources
              </h3>
              <div className="space-y-3">
                {data.analytics.charts.referrers.length > 0 ? (
                  data.analytics.charts.referrers.slice(0, 5).map((referrer, index) => (
                    <div key={referrer.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 truncate max-w-32">{referrer.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{
                              width: `${data.analytics.charts.referrers[0] ? (referrer.value / data.analytics.charts.referrers[0].value) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">
                          {referrer.value}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Share2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No referrer data available</p>
                    <p className="text-sm">Traffic sources will appear as users visit your link</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
