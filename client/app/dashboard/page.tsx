'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    api.get('/api/bookings/my')
      .then(res => setBookings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, router])

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-400">Loading...</div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">My Bookings</h1>
      <p className="text-gray-500 mb-6">Welcome, {user?.name}</p>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No bookings yet.{' '}
          <a href="/search" className="text-blue-600">Find a hospital</a>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: any) => (
            <div key={booking._id}
              className="bg-white border rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{booking.testName}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {booking.hospital?.name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    📅 {new Date(booking.slot).toLocaleDateString('en-IN', {
                      weekday: 'long', year: 'numeric',
                      month: 'long', day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    🕐 {new Date(booking.slot).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium
                    ${booking.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    {booking.status}
                  </span>
                  <div className="text-blue-600 font-semibold mt-2">
                    ₹{booking.testPrice}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}