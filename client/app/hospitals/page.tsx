import HospitalCard from '../components/HospitalCard'

async function getHospitals() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/hospitals`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error('Failed to fetch hospitals')
  return res.json()
}

export default async function HospitalsPage() {
  const hospitals = await getHospitals()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Hospitals near you</h1>
        <p className="text-gray-500 mt-1">{hospitals.length} hospitals found</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map((h: any) => (
          <HospitalCard key={h._id} hospital={h} />
        ))}
      </div>
    </div>
  )
}