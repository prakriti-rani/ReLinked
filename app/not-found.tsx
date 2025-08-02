'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Link2, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mb-8">
          <Link2 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Link Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, the short link you're looking for doesn't exist or has expired.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Home className="h-5 w-5" />
            <span>Go Home</span>
          </Link>
          
          <div className="text-center">
            <button
              onClick={() => window.history.back()}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Go Back</span>
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact us</Link></p>
        </div>
      </motion.div>
    </div>
  )
}
