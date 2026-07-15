'use client'
import { useEffect, useState } from 'react'

interface Props {
  hospitalId: string
  reviewCount: number
}

export default function ReviewSummary({ hospitalId, reviewCount }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (reviewCount < 2) return // don't show for hospitals with < 2 reviews
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://medcompare-api.onrender.com'}/api/ai/review-summary/${hospitalId}`)
      .then(res => res.json())
      .then(data => setSummary(data.summary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [hospitalId, reviewCount])

  // Don't render if not enough reviews
  if (reviewCount < 2) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          AI Review Summary
        </span>
        <span className="text-xs text-blue-400 ml-auto">
          Based on {reviewCount} reviews
        </span>
      </div>

      {loading && (
        <div className="flex gap-1.5 mt-2 ml-7">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}

      {!loading && summary && (
        <p className="text-sm text-gray-700 leading-relaxed ml-7">
          {summary}
        </p>
      )}

      {!loading && !summary && (
        <p className="text-xs text-blue-400 ml-7">
          Summary unavailable
        </p>
      )}
    </div>
  )
}
