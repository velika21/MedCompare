'use client'
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/axios'
import HospitalCard from '../components/HospitalCard'
import dynamic from 'next/dynamic'
const HospitalMap = dynamic(() => import('../components/HospitalMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] rounded-xl border bg-gray-100 flex items-center justify-center text-gray-400">
      Loading map...
    </div>
  )
})

const TEST_TYPES = ['MRI Brain', 'X-Ray Chest', 'CT Scan Abdomen',
                    'Blood CBC', 'Thyroid Profile', 'Ultrasound Abdomen']

export default function SearchPage() {
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [userLocation, setUserLocation] = useState<{lat:number,lng:number} | null>(null)
  const [filters, setFilters] = useState({
    testName: '',
    maxPrice: '10000',
    minRating: '0',
    radius: '10'
  })

  // Get user's location on page load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        })
      },
      () => {
        // Default to Indore if location denied
        setUserLocation({ lat: 22.7196, lng: 75.8577 })
      }
    )
  }, [])

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

// Run search immediately with default Indore location
useEffect(() => {
  search({ lat: 22.7196, lng: 75.8577 })
}, [])  // runs once on mount

// Re-run when filters change
useEffect(() => {
  if (filters) search()
}, [filters])

// Get real location and re-search
useEffect(() => {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      setUserLocation(loc)
      search(loc)
    },
    () => {
      setUserLocation({ lat: 22.7196, lng: 75.8577 })
    }
  )
}, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-6">Find hospitals near you</h1>

      {/* Filter bar */}
      <div className="bg-white border rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Test type</label>
          <select value={filters.testName}
            onChange={e => setFilters({...filters, testName: e.target.value})}
            className="w-full border rounded-lg px-2 py-1.5 text-sm">
            <option value="">All tests</option>
            {TEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Max price: ₹{parseInt(filters.maxPrice).toLocaleString()}
          </label>
          <input type="range" min="500" max="10000" step="500"
            value={filters.maxPrice}
            onChange={e => setFilters({...filters, maxPrice: e.target.value})}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Min rating: {filters.minRating}★
          </label>
          <input type="range" min="0" max="5" step="0.5"
            value={filters.minRating}
            onChange={e => setFilters({...filters, minRating: e.target.value})}
            className="w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1 block">
            Radius: {filters.radius}km
          </label>
          <input type="range" min="1" max="50" step="1"
            value={filters.radius}
            onChange={e => setFilters({...filters, radius: e.target.value})}
            className="w-full"
          />
        </div>
      </div>

      {/* Map */}
      <div className="mb-6">
        <HospitalMap hospitals={hospitals} userLocation={userLocation} />
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-gray-500 mb-4">
          {loading ? 'Searching...' : `${hospitals.length} hospitals found`}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hospitals.map((h: any) => (
            <HospitalCard key={h._id} hospital={h} />
          ))}
        </div>
        {!loading && hospitals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No hospitals found. Try increasing the radius or changing filters.
          </div>
        )}
      </div>
    </div>
  )
}