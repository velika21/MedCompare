const express = require('express')
const router = express.Router()
const Hospital = require('../models/Hospital')
const { protect, adminOnly } = require('../middleware/auth')
const redis = require('../config/redis')

const CACHE_TTL = 600 // 10 minutes in seconds

// GET /api/hospitals/search — with Redis cache-aside pattern
router.get('/search', async (req, res) => {
  try {
    const {
      lat, lng,
      radius = 10,
      maxPrice,
      minRating,
      testName
    } = req.query

    // Build a unique cache key from the query params
    const cacheKey = `search:${lat}:${lng}:${radius}:${maxPrice || ''}:${minRating || ''}:${testName || ''}`

    // Step 1: Check cache first
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log('Cache HIT:', cacheKey)
        return res.json(cached)
      }
      console.log('Cache MISS:', cacheKey)
    } catch (cacheErr) {
      // If Redis fails, continue to DB — never let cache break the app
      console.error('Redis error (continuing to DB):', cacheErr.message)
    }

    // Step 2: Build MongoDB query
    const query = {}

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000
        }
      }
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) }
    }

    if (testName) {
      query['tests.name'] = { $regex: testName, $options: 'i' }
    }

    if (maxPrice) {
      query['tests.price'] = { $lte: parseFloat(maxPrice) }
    }

    // Step 3: Query MongoDB
    const hospitals = await Hospital.find(query).limit(20)

    // Step 4: Store result in cache with 10-minute TTL
    try {
      await redis.set(cacheKey, hospitals, { ex: CACHE_TTL })
      console.log('Cached result for:', cacheKey)
    } catch (cacheErr) {
      console.error('Redis set error (continuing):', cacheErr.message)
    }

    res.json(hospitals)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospitals — public, all hospitals (no cache needed, used rarely)
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({})
    res.json(hospitals)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospitals/:id — public, single hospital
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
    if (!hospital) return res.status(404).json({ message: 'Not found' })
    res.json(hospital)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospitals — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const hospital = new Hospital({
      ...req.body,
      admin: req.user.id,
      location: {
        type: 'Point',
        coordinates: [req.body.lng, req.body.lat]
      }
    })
    await hospital.save()
    res.status(201).json(hospital)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospitals/:id/reviews — only after confirmed booking
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const Review = require('../models/Review')
    const Booking = require('../models/Booking')

    const hasBooking = await Booking.findOne({
      user: req.user.id,
      hospital: req.params.id,
      status: 'confirmed'
    })
    if (!hasBooking) {
      return res.status(403).json({
        message: 'You can only review hospitals you have visited'
      })
    }

    const { rating, comment } = req.body
    const review = await Review.create({
      user: req.user.id,
      hospital: req.params.id,
      booking: hasBooking._id,
      rating,
      comment
    })

    // Update hospital average rating
    const allReviews = await Review.find({ hospital: req.params.id })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    await require('../models/Hospital').findByIdAndUpdate(req.params.id, {
      rating: Math.round(avgRating * 10) / 10,
      totalReviews: allReviews.length
    })

    res.status(201).json(review)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this hospital' })
    }
    res.status(500).json({ message: err.message })
  }
})

// GET /api/hospitals/:id/reviews — public
router.get('/:id/reviews', async (req, res) => {
  try {
    const Review = require('../models/Review')
    const reviews = await Review.find({ hospital: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router