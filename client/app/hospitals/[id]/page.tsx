'use client'
import ReviewSummary from '../../components/ReviewSummary'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

export default function HospitalDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [hospital, setHospital] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewMsg, setReviewMsg] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/${id}`)
      .then(res => res.json())
      .then(data => setHospital(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  const submitReview = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/hospitals/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-storage')
            ? JSON.parse(localStorage.getItem('auth-storage')!).state.token
            : ''}`
        },
        body: JSON.stringify(reviewForm)
      })
      setReviewMsg('Review submitted! Thank you.')
    } catch {
      setReviewMsg('Failed to submit review.')
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-gray-400">Loading...</div>
  )

  if (!hospital || hospital.message === 'Not found') return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-red-500">Hospital not found</div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{hospital.name}</h1>
              {hospital.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              {hospital.address?.street}, {hospital.address?.city}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              📞 {hospital.phone}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-semibold">⭐ {hospital.rating}</div>
            <div className="text-sm text-gray-400">{hospital.totalReviews} reviews</div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          🕐 Open: {hospital.openTime} – {hospital.closeTime}
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">Available Tests</h2>
      <div className="space-y-3">
        {hospital.tests?.length > 0 ? (
          hospital.tests.map((test: any) => (
            <div key={test._id}
              className="bg-white border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{test.name}</div>
                <div className="text-sm text-gray-500 mt-0.5">
                  Duration: {test.duration}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-lg font-semibold text-blue-600">
                  ₹{test.price}
                </div>
                <Link
                  href={`/book/${hospital._id}?test=${encodeURIComponent(test.name)}&price=${test.price}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                  Book
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400 text-sm">No tests listed</div>
        )}
      </div>
      {/* AI Review Summary */}
        <ReviewSummary
          hospitalId={id}
          reviewCount={hospital.totalReviews || 0}
        />

      {user && (
        <div className="mt-8 bg-white border rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Leave a Review</h2>
          <div className="mb-3">
            <label className="text-sm text-gray-600 mb-1 block">Rating</label>
            <select value={reviewForm.rating}
              onChange={e => setReviewForm({...reviewForm, rating: +e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm">
              {[5,4,3,2,1].map(n => (
                <option key={n} value={n}>{'⭐'.repeat(n)} ({n})</option>
              ))}
            </select>
          </div>
          <textarea
            value={reviewForm.comment}
            onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
            placeholder="Share your experience..."
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={submitReview}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
            Submit Review
          </button>
          {reviewMsg && <p className="text-sm text-green-600 mt-2">{reviewMsg}</p>}
        </div>
      )}
    </div>
  )
}