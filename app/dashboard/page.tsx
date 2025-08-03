'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Link2, 
  BarChart3, 
  Plus, 
  Copy, 
  ExternalLink, 
  Trash2,
  Eye,
  Calendar,
  Globe,
  QrCode
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import { formatDateIST, DateFormats } from '@/lib/timezone'

interface UrlData {
  _id: string
  originalUrl: string
  shortCode: string
  customAlias?: string
  clicks: number
  createdAt: string
  qrCode?: string
  metadata: {
    aiSuggestions?: string
    riskLevel: string
  }
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [urls, setUrls] = useState<UrlData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUrls: 0,
    totalClicks: 0,
    topPerformer: null as UrlData | null
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated') {
      fetchUrls()
      
      // Set up auto-refresh every 60 seconds for dashboard
      const interval = setInterval(() => {
        fetchUrls()
      }, 60000) // Update every 60 seconds (less frequent than analytics)
      
      // Cleanup interval on component unmount
      return () => clearInterval(interval)
    }
  }, [status, router])

  const fetchUrls = async () => {
    try {
      const response = await fetch('/api/urls')
      if (response.ok) {
        const data = await response.json()
        setUrls(data.urls)
        
        // Calculate stats
        const totalClicks = data.urls.reduce((sum: number, url: UrlData) => sum + url.clicks, 0)
        const topPerformer = data.urls.reduce((top: UrlData | null, url: UrlData) => 
          !top || url.clicks > top.clicks ? url : top
        , null)
        
        setStats({
          totalUrls: data.urls.length,
          totalClicks,
          topPerformer
        })
      }
    } catch (error) {
      console.error('Failed to fetch URLs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateQrCode = async (urlId: string) => {
    try {
      const response = await fetch(`/api/urls/${urlId}/qr`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchUrls() // Refresh the list to show the new QR code
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  const copyToClipboard = async (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`
    await navigator.clipboard.writeText(shortUrl)
    // You could add a toast notification here
  }

  const deleteUrl = async (id: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) return
    
    try {
      const response = await fetch(`/api/urls/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchUrls() // Refresh the list
      }
    } catch (error) {
      console.error('Failed to delete URL:', error)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {session?.user?.name}!
            </h1>
            <p className="text-gray-600">
              Manage your shortened URLs and view analytics
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center">
                <Link2 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total URLs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUrls}</p>
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
                <BarChart3 className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClicks}</p>
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
                <Globe className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Performer</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.topPerformer ? `${stats.topPerformer.clicks} clicks` : 'No data'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => router.push('/')}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create New URL</span>
            </button>
            <button className="btn-secondary flex items-center space-x-2" onClick={() => router.push('/analytics')}>
              <BarChart3 className="h-5 w-5" />
              <span>View Analytics</span>
            </button>
          </div>

          {/* URLs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Your URLs</h2>
              <span className="text-sm text-gray-500">{urls.length} total</span>
            </div>

            {urls.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No URLs yet</h3>
                <p className="text-gray-600 mb-4">Create your first shortened URL to get started</p>
                <button
                  onClick={() => router.push('/')}
                  className="btn-primary"
                >
                  Create Your First URL
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {urls.map((url) => (
                  <div
                    key={url._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {window.location.origin}/{url.customAlias || url.shortCode}
                          </h3>
                          {url.metadata.riskLevel === 'low' && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Secure
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-1">{url.originalUrl}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <Eye className="h-3 w-3 mr-1" />
                            {url.clicks} clicks
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDateIST(url.createdAt, DateFormats.short)}
                          </span>
                        </div>
                      </div>
                      
                      {/* QR Code Display */}
                      <div className="flex flex-col items-center space-y-1">
                        {url.qrCode ? (
                          <img
                            src={url.qrCode}
                            alt="QR Code"
                            className="w-12 h-12 border border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors"
                            title="Click to download QR Code"
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = url.qrCode!;
                              link.download = `qr-${url.shortCode}.png`;
                              link.click();
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => generateQrCode(url._id)}
                            className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center hover:border-blue-500 transition-colors"
                            title="Generate QR Code"
                          >
                            <QrCode className="h-5 w-5 text-gray-400" />
                          </button>
                        )}
                        <span className="text-xs text-gray-500">
                          {url.qrCode ? 'Download' : 'Generate'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => copyToClipboard(url.customAlias || url.shortCode)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={`/${url.customAlias || url.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => router.push(`/analytics/${url._id}`)}
                        className="p-2 text-gray-500 hover:text-green-600 transition-colors"
                        title="View analytics"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteUrl(url._id)}
                        className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
