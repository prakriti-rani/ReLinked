'use client'

import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Link2, BarChart3, Shield, Zap, QrCode, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import UrlShortener from '@/components/UrlShortener'
import Footer from '@/components/Footer'

export default function Home() {
  const { data: session, status } = useSession()

  // Remove automatic redirect to dashboard
  // Users can access the homepage whether signed in or not

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Shorten URLs with
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Intelligence
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create short, memorable links with powerful analytics, AI insights, and enterprise-grade security. 
              Perfect for businesses, marketers, and developers.
            </p>
          </motion.div>

          {/* URL Shortener Component */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <UrlShortener />
          </motion.div>

          {/* Anonymous User CTA */}
          {!session && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="max-w-3xl mx-auto mb-16 text-center"
            >
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  🚀 Want More Features?
                </h3>
                <p className="text-gray-600 mb-4">
                  Sign up for free to unlock custom aliases, detailed analytics, AI insights, and more!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth/signup" className="btn-primary">
                    Sign Up Free
                  </Link>
                  <Link href="/auth/signin" className="btn-secondary">
                    Already have an account?
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20"
          >
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              title="Advanced Analytics"
              description="Get detailed insights with click tracking, device information, browser data, and referrer analytics with interactive charts."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8 text-purple-600" />}
              title="AI-Powered Insights"
              description="Our Google Gemini AI analyzes your URLs to provide smart suggestions and content insights."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-green-600" />}
              title="Security Features"
              description="Rate limiting, password protection, link expiration, and basic security measures to protect your links."
            />
            <FeatureCard
              icon={<Link2 className="h-8 w-8 text-indigo-600" />}
              title="Custom Short Links"
              description="Create branded short links with custom aliases that match your brand identity."
            />
            <FeatureCard
              icon={<QrCode className="h-8 w-8 text-teal-600" />}
              title="QR Code Generation"
              description="Automatically generate QR codes for your shortened links for easy mobile sharing."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8 text-pink-600" />}
              title="User Management"
              description="Secure authentication and personal dashboard to manage all your links."
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Building a better way to shorten and track your links
            </h2>
            <p className="text-lg text-gray-600">
              Join the growing community of users who trust ReLinked for their URL shortening needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <StatCard number="1K+" label="Links Created" />
            <StatCard number="7K+" label="Clicks Tracked" />
            <StatCard number="Instant" label="Analytics" />
            <StatCard number="Stable" label="Performance" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="card text-center"
    >
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="text-center"
    >
      <div className="text-4xl font-bold text-blue-600 mb-2">{number}</div>
      <div className="text-gray-600">{label}</div>
    </motion.div>
  )
}
