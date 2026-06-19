const express = require('express')
const router = express.Router()
const Hospital = require('../models/Hospital')
const { protect, adminOnly } = require('../middleware/auth')

// GET  public, get all hospitals anyone can search
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({})
    res.json(hospitals)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/search', async (req, res) => {
  try {
    const {
      lat, lng,
      radius = 10,      // km, default 10km
      maxPrice,
      minRating,
      testName
    } = req.query

    // Build the query object
    const query = {}

    // Geo filter — only if lat/lng provided
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000  // km → metres
        }
      }
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) }
    }

    // Test name filter
    if (testName) {
      query['tests.name'] = { $regex: testName, $options: 'i' }
    }

    // Price filter — hospitals that have at least one test under maxPrice
    if (maxPrice) {
      query['tests.price'] = { $lte: parseFloat(maxPrice) }
    }

    const hospitals = await Hospital.find(query).limit(20)
    res.json(hospitals)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET like by clicking it
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id)
    if (!hospital) return res.status(404).json({ message: 'Not found' })
    res.json(hospital)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/hospitals — admin only can create one
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

router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const Review = require('../models/Review')
    const Booking = require('../models/Booking')

    // Check user has a confirmed booking at this hospital
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