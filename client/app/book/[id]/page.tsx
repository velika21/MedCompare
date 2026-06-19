'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/axios'

// Generate time slots from 9am to 5pm, every 30 min
function generateSlots() {
  const slots = []
  for (let h = 9; h < 17; h++) {
    slots.push(`${h.toString().padStart(2,'0')}:00`)
    slots.push(`${h.toString().padStart(2,'0')}:30`)
  }
  return slots
}

const ALL_SLOTS = generateSlots()

declare global {
  interface Window { Razorpay: any }
}

export default function BookingPage() {
  const { id: hospitalId } = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, token } = useAuthStore()

  const testName = searchParams.get('test') || ''
  const testPrice = parseInt(searchParams.get('price') || '0')

  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [bookedTimes, setBookedTimes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [paying, setPaying] = useState(false)

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0]

  // Fetch booked slots when date changes
  useEffect(() => {
    if (!selectedDate || !hospitalId || !testName) return
    api.get(`/api/bookings/slots?hospitalId=${hospitalId}&testName=${encodeURIComponent(testName)}&date=${selectedDate}`)
      .then(res => setBookedTimes(res.data.bookedTimes))
      .catch(console.error)
  }, [selectedDate, hospitalId, testName])

  const handlePayment = async () => {
    if (!user) return router.push('/auth/login')
    if (!selectedDate || !selectedSlot) {
      alert('Please select a date and time slot')
      return
    }

    setPaying(true)
    try {
      // Step 1: Create Razorpay order on backend
      const { data: order } = await api.post('/api/bookings/create-order', {
        amount: testPrice
      })

      // Step 2: Load Razorpay checkout script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      script.onload = () => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: 'INR',
          name: 'MedCompare',
          description: `${testName} booking`,
          order_id: order.id,
          handler: async (response: any) => {
            // Step 3: Verify payment on backend + save booking
            try {
              const slotDateTime = new Date(`${selectedDate}T${selectedSlot}:00`)
              await api.post('/api/bookings/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                hospitalId,
                testName,
                testPrice,
                slot: slotDateTime.toISOString()
              })
              alert('Booking confirmed! 🎉')
              router.push('/dashboard')
            } catch (err: any) {
              alert(err.response?.data?.message || 'Booking failed')
            }
          },
          prefill: {
            name: user.name,
            email: user.email
          },
          theme: { color: '#2563eb' }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment failed')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Book Appointment</h1>
      <p className="text-gray-500 mb-6">{testName}</p>

      {/* Date picker */}
      <div className="bg-white border rounded-xl p-4 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Date
        </label>
        <input type="date" min={today}
          value={selectedDate}
          onChange={e => {
            setSelectedDate(e.target.value)
            setSelectedSlot('')
          }}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="bg-white border rounded-xl p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Time Slot
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ALL_SLOTS.map(slot => {
              const isBooked = bookedTimes.includes(slot)
              const isSelected = selectedSlot === slot
              return (
                <button key={slot}
                  disabled={isBooked}
                  onClick={() => setSelectedSlot(slot)}
                  className={`py-2 rounded-lg text-xs font-medium transition-colors
                    ${isBooked
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 border'
                    }`}>
                  {slot}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Grey slots are already booked
          </p>
        </div>
      )}

      {/* Summary + pay button */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-500">Test</span>
          <span className="font-medium">{testName}</span>
        </div>
        <div className="flex justify-between text-sm mb-4">
          <span className="text-gray-500">Date</span>
          <span className="font-medium">{selectedDate || '—'}</span>
        </div>
        <div className="flex justify-between text-sm mb-6">
          <span className="text-gray-500">Time</span>
          <span className="font-medium">{selectedSlot || '—'}</span>
        </div>
        <div className="flex justify-between font-semibold mb-6">
          <span>Total</span>
          <span className="text-blue-600">₹{testPrice}</span>
        </div>
        <button
          onClick={handlePayment}
          disabled={paying || !selectedDate || !selectedSlot}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50">
          {paying ? 'Processing...' : `Pay ₹${testPrice}`}
        </button>
        {!user && (
          <p className="text-xs text-center text-gray-400 mt-3">
            You need to login to book
          </p>
        )}
      </div>
    </div>
  )
}