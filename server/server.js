const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const connectDB = require('./config/db')

dotenv.config()
connectDB()

const app = express()
app.use(cors({
  origin: ['http://localhost:3000', 'https://med-compare-velika1821.vercel.app']
}))
app.use(express.json())
app.use('/api/ai', require('./routes/ai'))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/hospitals', require('./routes/hospitals'))
app.use('/api/bookings', require('./routes/bookings'))


app.get('/', (req, res) => res.json({ message: 'MedCompare API running' }))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))