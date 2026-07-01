'use client'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import api from '@/lib/axios'

const HospitalMap = dynamic(() => import('../components/HospitalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
      Loading map...
    </div>
  )
})

const TEST_TYPES = [
  'MRI Brain', 'X-Ray Chest', 'CT Scan Abdomen',
  'Blood CBC', 'Thyroid Profile', 'Ultrasound Abdomen'
]

interface Test { name: string; price: number; duration: string; _id: string }
interface Hospital {
  _id: string
  name: string
  address: { street: string; city: string }
  location: { coordinates: [number, number] }
  rating: number
  totalReviews: number
  tests: Test[]
  isVerified: boolean
  openTime: string
  closeTime: string
}

export default function SearchPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [filters, setFilters] = useState({
    testName: '',
    maxPrice: '10000',
    minRating: '0',
    radius: '10'
  })

  const search = useCallback(async (location?: { lat: number; lng: number }) => {
    const loc = location || userLocation || { lat: 22.7196, lng: 75.8577 }
    setLoading(true)
    try {
      const params = new URLSearchParams({
        lat: loc.lat.toString(),
        lng: loc.lng.toString(),
        radius: filters.radius,
        maxPrice: filters.maxPrice,
        minRating: filters.minRating,
        ...(filters.testName && { testName: filters.testName })
      })
      const { data } = await api.get(`/api/hospitals/search?${params}`)
      setHospitals(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userLocation, filters])

  useEffect(() => {
    search({ lat: 22.7196, lng: 75.8577 })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        search(loc)
      },
      () => setUserLocation({ lat: 22.7196, lng: 75.8577 })
    )
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(), 400)
    return () => clearTimeout(t)
  }, [filters])

  const updateFilter = (key: string, value: string) =>
    setFilters(f => ({ ...f, [key]: value }))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top filter bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-3 items-center">

            {/* Test type */}
            <select
              value={filters.testName}
              onChange={e => updateFilter('testName', e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]">
              <option value="">All test types</option>
              {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Price */}
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Max price</span>
              <input type="range" min="500" max="10000" step="500"
                value={filters.maxPrice}
                onChange={e => updateFilter('maxPrice', e.target.value)}
                className="w-24" />
              <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
                ₹{parseInt(filters.maxPrice).toLocaleString()}
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Min rating</span>
              <input type="range" min="0" max="5" step="0.5"
                value={filters.minRating}
                onChange={e => updateFilter('minRating', e.target.value)}
                className="w-20" />
              <span className="text-xs font-medium text-gray-700">
                {parseFloat(filters.minRating).toFixed(1)}★
              </span>
            </div>

            {/* Radius */}
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
              <span className="text-xs text-gray-500 whitespace-nowrap">Radius</span>
              <input type="range" min="1" max="50" step="1"
                value={filters.radius}
                onChange={e => updateFilter('radius', e.target.value)}
                className="w-20" />
              <span className="text-xs font-medium text-gray-700">{filters.radius}km</span>
            </div>

            <span className="ml-auto text-sm text-gray-400">
              {loading ? 'Searching...' : `${hospitals.length} hospitals`}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: results */}
          <div className="lg:col-span-3 space-y-3">
            {loading && hospitals.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border rounded-2xl p-5 animate-pulse">
                    <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-100 rounded w-20" />
                      <div className="h-6 bg-gray-100 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && hospitals.length === 0 && (
              <div className="bg-white border rounded-2xl p-10 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium text-gray-700 mb-1">No hospitals found</p>
                <p className="text-sm text-gray-400">Try increasing the radius or clearing filters</p>
              </div>
            )}

            {hospitals.map((hospital) => {
              const minPrice = Math.min(...hospital.tests.map(t => t.price))
              return (
                <div key={hospital._id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                          {hospital.name}
                        </h3>
                        {hospital.isVerified && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 whitespace-nowrap">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {hospital.address.street}, {hospital.address.city}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-gray-800">
                        ⭐ {hospital.rating}
                      </div>
                      <div className="text-xs text-gray-400">{hospital.totalReviews} reviews</div>
                    </div>
                  </div>

                  {/* Tests */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hospital.tests.slice(0, 3).map(test => (
                      <span key={test._id}
                        className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                        {test.name} — ₹{test.price}
                      </span>
                    ))}
                    {hospital.tests.length > 3 && (
                      <span className="text-xs text-gray-400 self-center">
                        +{hospital.tests.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Tests from{' '}
                      <span className="font-semibold text-gray-800 text-sm">₹{minPrice}</span>
                      <span className="ml-3 text-gray-300">•</span>
                      <span className="ml-3">🕐 {hospital.openTime}–{hospital.closeTime}</span>
                    </div>
                    <Link href={`/hospitals/${hospital._id}`}
                      className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap">
                      View & Book
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: map (sticky) */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <HospitalMap hospitals={hospitals} userLocation={userLocation} />
              <p className="text-xs text-gray-400 text-center mt-2">
                Click a pin to see hospital details
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
