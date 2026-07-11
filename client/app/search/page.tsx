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

      {/* Sticky filter bar */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-4 items-end">

            {/* Test type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Test type
              </label>
              <select
                value={filters.testName}
                onChange={e => updateFilter('testName', e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-500 min-w-[170px] text-gray-800 font-medium">
                <option value="">All test types</option>
                {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Divider */}
            <div className="hidden md:block h-10 w-px bg-gray-200 self-end mb-1" />

            {/* Max price */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Max price:{' '}
                <span className="text-blue-600 normal-case font-bold">
                  ₹{parseInt(filters.maxPrice).toLocaleString()}
                </span>
              </label>
              <input
                type="range" min="500" max="10000" step="500"
                value={filters.maxPrice}
                onChange={e => updateFilter('maxPrice', e.target.value)}
                className="w-full accent-blue-600 cursor-pointer h-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>₹500</span><span>₹10,000</span>
              </div>
            </div>

            {/* Min rating */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Min rating:{' '}
                <span className="text-blue-600 normal-case font-bold">
                  {parseFloat(filters.minRating).toFixed(1)} ⭐
                </span>
              </label>
              <input
                type="range" min="0" max="5" step="0.5"
                value={filters.minRating}
                onChange={e => updateFilter('minRating', e.target.value)}
                className="w-full accent-blue-600 cursor-pointer h-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Any</span><span>5 ⭐</span>
              </div>
            </div>

            {/* Radius */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Radius:{' '}
                <span className="text-blue-600 normal-case font-bold">{filters.radius}km</span>
              </label>
              <input
                type="range" min="1" max="50" step="1"
                value={filters.radius}
                onChange={e => updateFilter('radius', e.target.value)}
                className="w-full accent-blue-600 cursor-pointer h-2"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1km</span><span>50km</span>
              </div>
            </div>

            {/* Result count */}
            <div className="ml-auto flex items-end pb-1">
              {loading ? (
                <span className="text-sm text-gray-400 animate-pulse">Searching...</span>
              ) : (
                <span className="text-sm font-semibold text-gray-700">
                  {hospitals.length} hospitals found
                </span>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: hospital cards */}
          <div className="lg:col-span-3 space-y-3">

            {/* Skeleton loading */}
            {loading && hospitals.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse">
                    <div className="flex justify-between mb-3">
                      <div className="space-y-2 flex-1 pr-4">
                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                      <div className="h-12 w-16 bg-gray-100 rounded-xl" />
                    </div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-100 rounded-lg w-28" />
                      <div className="h-6 bg-gray-100 rounded-lg w-24" />
                      <div className="h-6 bg-gray-100 rounded-lg w-20" />
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-50">
                      <div className="h-4 bg-gray-100 rounded w-32" />
                      <div className="h-8 bg-gray-100 rounded-xl w-24" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && hospitals.length === 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
                <div className="text-5xl mb-4">🏥</div>
                <h3 className="font-semibold text-gray-800 mb-1">No hospitals found</h3>
                <p className="text-sm text-gray-400 mb-5">
                  Try increasing the search radius or removing filters
                </p>
                <button
                  onClick={() => setFilters({ testName: '', maxPrice: '10000', minRating: '0', radius: '25' })}
                  className="text-sm text-blue-600 border-2 border-blue-200 px-5 py-2 rounded-xl hover:bg-blue-50 transition-colors font-medium">
                  Reset all filters
                </button>
              </div>
            )}

            {/* Hospital cards */}
            {hospitals.map((hospital) => {
              const minPrice = Math.min(...hospital.tests.map(t => t.price))
              return (
                <div key={hospital._id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all group">

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                          {hospital.name}
                        </h3>
                        {hospital.isVerified && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-medium whitespace-nowrap">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        📍 {hospital.address.street}, {hospital.address.city}
                      </p>
                      <p className="text-xs text-gray-400">
                        🕐 Open {hospital.openTime} – {hospital.closeTime}
                      </p>
                    </div>
                    <div className="text-center flex-shrink-0 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <div className="text-base font-bold text-amber-700">
                        ⭐ {hospital.rating}
                      </div>
                      <div className="text-xs text-amber-500">{hospital.totalReviews} reviews</div>
                    </div>
                  </div>

                  {/* Test badges */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {hospital.tests.slice(0, 3).map(test => (
                      <span key={test._id}
                        className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 font-medium">
                        {test.name} — ₹{test.price}
                      </span>
                    ))}
                    {hospital.tests.length > 3 && (
                      <span className="text-xs text-gray-400 self-center pl-1">
                        +{hospital.tests.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      Tests from{' '}
                      <span className="font-bold text-gray-900 text-base">₹{minPrice}</span>
                    </div>
                    <Link href={`/hospitals/${hospital._id}`}
                      className="text-sm bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold">
                      View & Book →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Right: sticky map */}
          <div className="lg:col-span-2">
            <div className="sticky top-28">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <HospitalMap hospitals={hospitals} userLocation={userLocation} />
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">
                📍 Click any pin to see hospital details
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
