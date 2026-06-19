import Link from 'next/link'

interface Test {
  name: string
  price: number
}

interface Hospital {
  _id: string
  name: string
  address: { street: string; city: string }
  rating: number
  totalReviews: number
  tests: Test[]
  isVerified: boolean
  openTime: string
  closeTime: string
}

export default function HospitalCard({ hospital }: { hospital: Hospital }) {
  const minPrice = Math.min(...hospital.tests.map(t => t.price))

  return (
    <div className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{hospital.name}</h3>
            {hospital.isVerified && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {hospital.address.street}, {hospital.address.city}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">⭐ {hospital.rating}</div>
          <div className="text-xs text-gray-400">{hospital.totalReviews} reviews</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {hospital.tests.slice(0, 3).map((test) => (
          <span key={test.name}
            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
            {test.name} — ₹{test.price}
          </span>
        ))}
        {hospital.tests.length > 3 && (
          <span className="text-xs text-gray-400">+{hospital.tests.length - 3} more</span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Tests from <strong className="text-gray-900">₹{minPrice}</strong>
        </span>
        <Link href={`/hospitals/${hospital._id}`}
          className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
          View & Book
        </Link>
      </div>
    </div>
  )
}