const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Hospital = require('./models/Hospital')
dotenv.config()

const hospitals = [
  {
    name: "Bombay Hospital Indore",
    address: { street: "Ring Road", city: "Indore", state: "MP", pincode: "452010" },
    location: { type: "Point", coordinates: [75.8577, 22.7196] },
    phone: "0731-4077000",
    tests: [
      { name: "MRI Brain", price: 4500, duration: "45 min" },
      { name: "X-Ray Chest", price: 300, duration: "10 min" },
      { name: "CT Scan Abdomen", price: 3500, duration: "30 min" }
    ],
    rating: 4.3, totalReviews: 124, isVerified: true,
    openTime: "08:00", closeTime: "21:00"
  },
  {
    name: "CHL Apollo Hospital",
    address: { street: "AB Road", city: "Indore", state: "MP", pincode: "452001" },
    location: { type: "Point", coordinates: [75.8780, 22.7243] },
    phone: "0731-4066000",
    tests: [
      { name: "MRI Brain", price: 5500, duration: "45 min" },
      { name: "X-Ray Chest", price: 400, duration: "10 min" },
      { name: "Blood CBC", price: 250, duration: "Same day" },
      { name: "Thyroid Profile", price: 600, duration: "Same day" }
    ],
    rating: 4.5, totalReviews: 230, isVerified: true,
    openTime: "07:00", closeTime: "22:00"
  },
  {
    name: "Choithram Hospital",
    address: { street: "Manik Bagh Road", city: "Indore", state: "MP", pincode: "452014" },
    location: { type: "Point", coordinates: [75.8421, 22.7018] },
    phone: "0731-2362222",
    tests: [
      { name: "MRI Brain", price: 3800, duration: "45 min" },
      { name: "X-Ray Chest", price: 250, duration: "10 min" },
      { name: "Ultrasound Abdomen", price: 800, duration: "20 min" }
    ],
    rating: 4.1, totalReviews: 98, isVerified: true,
    openTime: "08:00", closeTime: "20:00"
  }
]

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  await Hospital.deleteMany({})
  await Hospital.insertMany(hospitals)
  console.log('Seeded', hospitals.length, 'hospitals')
  process.exit(0)
}

seed()