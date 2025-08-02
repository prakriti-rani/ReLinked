'use client'

import Link from 'next/link'
import { Link2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white/70 backdrop-blur-sm border-t border-white/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Link2 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">ReLinked</span>
          </div>
          <p className="text-gray-500 text-sm">
            Simple, fast, reliable URL shortener • © 2024 ReLinked
          </p>
        </div>
      </div>
    </footer>
  )
}
