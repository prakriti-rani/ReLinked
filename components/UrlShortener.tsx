'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Link2, Copy, ExternalLink, Shield, Sparkles, Lock, Clock } from 'lucide-react'

export default function UrlShortener() {
  const { data: session } = useSession()
  const [url, setUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [password, setPassword] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url) return

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: url,
          customAlias: customAlias || undefined,
          password: password || undefined,
          expiresAt: expiresAt || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setResult(data)
        setUrl('')
        setCustomAlias('')
        setPassword('')
        setExpiresAt('')
      } else {
        const error = await response.json()
        if (error.error === 'Custom aliases require sign-in') {
          alert('Custom aliases require sign-in. Your URL will be created with a random short code.')
          // Retry without custom alias
          const retryResponse = await fetch('/api/urls', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalUrl: url,
            }),
          })
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            setResult(retryData)
            setUrl('')
            setCustomAlias('')
          } else {
            alert('Something went wrong. Please try again.')
          }
        } else {
          alert(error.error || 'Something went wrong')
        }
      }
    } catch (error) {
      alert('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (result?.shortUrl) {
      await navigator.clipboard.writeText(result.shortUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Enter your long URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very-long-url-that-needs-shortening"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="customAlias" className="block text-sm font-medium text-gray-700 mb-2">
              Custom alias (optional) {!session && <span className="text-orange-600 text-xs">- Sign in required</span>}
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                relinked.app/
              </span>
              <input
                type="text"
                id="customAlias"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                placeholder={session ? "my-custom-link" : "Sign in for custom aliases"}
                className={`flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${!session ? 'bg-gray-100 text-gray-500' : ''}`}
                pattern="[a-zA-Z0-9-_]+"
                title="Only letters, numbers, hyphens, and underscores allowed"
                disabled={!session}
              />
            </div>
            {!session && (
              <p className="text-xs text-orange-600 mt-1">
                Sign in to use custom aliases, analytics, and AI features
              </p>
            )}
          </div>

          {session && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
              </button>
              
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="inline h-4 w-4 mr-1" />
                      Password Protection (optional)
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password to protect this link"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Visitors will need this password to access the link
                    </p>
                  </div>

                  <div>
                    <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Expiration Date (optional)
                    </label>
                    <input
                      type="datetime-local"
                      id="expiresAt"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Link will automatically expire after this date
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !url}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Link2 className="h-5 w-5" />
                <span>Shorten URL</span>
              </>
            )}
          </button>
        </form>

        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-green-800">
                {result.isDuplicate ? 'Existing URL found!' : 'URL shortened successfully!'}
              </h3>
              <div className="flex items-center space-x-2">
                {result.riskLevel === 'low' && (
                  <Shield className="h-4 w-4 text-green-600" />
                )}
                {result.aiSuggestions && (
                  <Sparkles className="h-4 w-4 text-purple-600" />
                )}
              </div>
            </div>

            {result.isDuplicate && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <p>✨ You've already shortened this URL! Here's your existing link instead of creating a duplicate.</p>
              </div>
            )}
            
            <div className="flex items-start space-x-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={result.shortUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Test link"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
              
              {result.qrCode && (
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-xs text-gray-600">QR Code</p>
                  <img
                    src={result.qrCode}
                    alt="QR Code"
                    className="w-20 h-20 border border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors"
                    title="Click to download QR Code"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = result.qrCode;
                      link.download = `qr-${result.shortCode}.png`;
                      link.click();
                    }}
                  />
                  <p className="text-xs text-gray-500">Click to download</p>
                </div>
              )}
            </div>

            {result.aiSuggestions && (
              <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded border border-purple-200">
                <div className="flex items-center space-x-1 mb-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-purple-800">AI Insights:</span>
                </div>
                <div className="text-gray-700 space-y-3">
                  {(() => {
                    // Function to format text and remove ** markdown
                    const formatText = (text: string) => {
                      // Split text by ** patterns and convert to JSX
                      const parts = text.split(/\*\*([^*]+)\*\*/g);
                      return parts.map((part, i) => {
                        if (i % 2 === 1) {
                          // This is the text that was between **
                          return <span key={i} className="font-semibold text-gray-900">{part}</span>
                        }
                        return <span key={i}>{part}</span>
                      })
                    }

                    // Split the AI suggestions into numbered items
                    const items = result.aiSuggestions
                      .split(/(?=\d+\.\s+)/) // Split before each numbered item
                      .filter(item => item.trim()) // Remove empty items
                      .map(item => item.replace(/^\d+\.\s*/, '').trim()) // Remove the number prefix
                      .filter(item => item.length > 0); // Remove empty items

                    return items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-purple-600 font-bold text-sm mt-0.5 flex-shrink-0">
                          {index + 1}.
                        </span>
                        <div className="flex-1 text-sm leading-relaxed">
                          {formatText(item)}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}

            {!session && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
                <p>
                  <strong>Want more features?</strong> Sign in to get analytics, custom aliases, and AI insights for your links.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
