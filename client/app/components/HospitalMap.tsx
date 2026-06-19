'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'

// Fix default marker icons broken in Next.js
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface Hospital {
  _id: string
  name: string
  address: { street: string; city: string }
  location: { coordinates: [number, number] }
  rating: number
}

interface Props {
  hospitals: Hospital[]
  userLocation: { lat: number; lng: number } | null
}

export default function HospitalMap({ hospitals, userLocation }: Props) {
  const centre = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [22.7196, 75.8577]  // default Indore

  return (
    <MapContainer
      center={centre as [number, number]}
      zoom={13}
      style={{ height: '400px', width: '100%', borderRadius: '12px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Blue marker for user location */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={icon}>
          <Popup>Your location</Popup>
        </Marker>
      )}

      {/* Red marker for each hospital */}
      {hospitals.map((hospital) => {
        const [lng, lat] = hospital.location.coordinates
        return (
          <Marker key={hospital._id} position={[lat, lng]} icon={icon}>
            <Popup>
              <div style={{ minWidth: '140px' }}>
                <strong>{hospital.name}</strong>
                <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                  {hospital.address.street}
                </p>
                <p style={{ fontSize: '12px', margin: '4px 0' }}>
                  ⭐ {hospital.rating}
                </p>
                <a href={`/hospitals/${hospital._id}`}
                  style={{ fontSize: '12px', color: '#2563eb' }}>
                  View & Book →
                </a>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}