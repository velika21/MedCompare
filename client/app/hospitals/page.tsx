'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Test { name: string; price: number; _id: string }
interface Hospital {
  _id: string
  name: string
  address: { street: string; city: string }
  rating: number
  totalReviews: number
  tests: Test[]
  isVerified: boolean
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://medcompare-api.onrender.com'}/api/hospitals`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setHospitals(data)
        else setError('Could not load hospitals')
      })
      .catch(() => setError('Could not connect to server. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="animate-pulse space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-gray-100 rounded-2xl h-32" />
        ))}
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-12 text-center">
      <div className="text-4xl mb-4">⚠️</div>
      <p className="text-gray-600 mb-4">{error}</p>
      <button onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm hover:bg-blue-700">
        Try again
      </button>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">All Hospitals</h1>
        <p className="text-gray-500 mt-1">{hospitals.length} hospitals listed</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map(h => {
          const minPrice = Math.min(...h.tests.map(t => t.price))
          return (
            <div key={h._id}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{h.name}</h3>
                    {h.isVerified && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    📍 {h.address?.street}, {h.address?.city}
                  </p>
                </div>
                <div className="text-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 flex-shrink-0">
                  <div className="text-sm font-bold text-amber-700">⭐ {h.rating}</div>
                  <div className="text-xs text-amber-500">{h.totalReviews} reviews</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {h.tests.slice(0, 3).map(t => (
                  <span key={t._id}
                    className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                    {t.name} — ₹{t.price}
                  </span>
                ))}
                {h.tests.length > 3 && (
                  <span className="text-xs text-gray-400 self-center">
                    +{h.tests.length - 3} more
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  From <span className="font-bold text-gray-900">₹{minPrice}</span>
                </span>
                <Link href={`/hospitals/${h._id}`}
                  className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-xl hover:bg-blue-700 font-medium">
                  View & Book →
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}