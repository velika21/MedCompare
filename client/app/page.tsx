import Link from 'next/link'

const stats = [
  { value: '500+', label: 'Hospitals listed' },
  { value: '₹300', label: 'Avg. savings per test' },
  { value: '3 min', label: 'Average booking time' },
  { value: '10,000+', label: 'Tests compared' },
]

const steps = [
  {
    number: '01',
    title: 'Search near you',
    desc: 'Enter your location or allow access. We show hospitals within your chosen radius instantly.',
  },
  {
    number: '02',
    title: 'Compare prices',
    desc: 'Filter by test type, price range, and rating. See real prices side by side — no calls needed.',
  },
  {
    number: '03',
    title: 'Book and pay',
    desc: 'Pick a time slot, pay securely via Razorpay, and get a confirmation. Done.',
  },
]

const tests = ['MRI Brain', 'X-Ray Chest', 'Blood CBC', 'CT Scan', 'Thyroid Profile', 'Ultrasound']

export default function Home() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase bg-blue-500 bg-opacity-40 px-4 py-1.5 rounded-full mb-6">
            Price transparency in healthcare
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-5">
            Stop calling 10 hospitals.<br />
            Find the cheapest MRI in 30 seconds.
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10">
            MedCompare shows diagnostic test prices across hospitals near you —
            compare, book, and pay without leaving your screen.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/search"
              className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors">
              Find hospitals near me
            </Link>
            <Link href="/hospitals"
              className="border border-blue-300 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
              Browse all hospitals
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-blue-600">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular tests */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Popular tests people search for
        </h2>
        <div className="flex flex-wrap gap-3">
          {tests.map((test) => (
            <Link
              key={test}
              href={`/search?testName=${encodeURIComponent(test)}`}
              className="bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-100">
              {test}
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 border-y">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-xl font-semibold text-gray-900 mb-12 text-center">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {steps.map((step) => (
              <div key={step.number}>
                <div className="text-4xl font-bold text-blue-100 mb-3">
                  {step.number}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why MedCompare */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-8 text-center">
          Why use MedCompare?
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: 'Real prices, not estimates',
              desc: 'Hospitals list their actual test prices. No hidden charges, no "call for pricing."',
            },
            {
              title: 'Sorted by distance',
              desc: 'See hospitals closest to you first. Adjust the radius to find the best price vs. distance trade-off.',
            },
            {
              title: 'Verified reviews',
              desc: 'Only patients who completed a booking can leave a review. No fake ratings.',
            },
            {
              title: 'Secure payments',
              desc: 'Pay via Razorpay with signature-verified transactions. Your money is safe.',
            },
          ].map((item) => (
            <div key={item.title}
              className="bg-white border rounded-xl p-6 hover:shadow-sm transition-shadow">
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Ready to find the best price for your test?
          </h2>
          <p className="text-blue-100 mb-8 text-sm">
            Search hospitals near you — it takes under a minute.
          </p>
          <Link href="/search"
            className="bg-white text-blue-700 font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors inline-block">
            Search now — it's free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-xs text-gray-400">
        <p>MedCompare — built with Next.js, MongoDB, and Razorpay</p>
        <p className="mt-1">
          <Link href="/hospitals" className="hover:text-gray-600 mr-4">Hospitals</Link>
          <Link href="/search" className="hover:text-gray-600 mr-4">Search</Link>
          <Link href="/auth/login" className="hover:text-gray-600">Login</Link>
        </p>
      </footer>

    </div>
  )
}
