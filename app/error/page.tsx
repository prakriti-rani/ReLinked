'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

export default function Error() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="mb-8">
          <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-8">
            We're sorry, but something unexpected happened. Please try again or contact support if the problem persists.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Try Again</span>
          </button>
          
          <div className="text-center">
            <Link
              href="/"
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Still having trouble? <Link href="/contact" className="text-blue-600 hover:text-blue-500">Contact support</Link></p>
        </div>
      </motion.div>
    </div>
  )
}
