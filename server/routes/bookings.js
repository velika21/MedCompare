const express = require('express')
const router = express.Router()
const Razorpay = require('razorpay')
const crypto = require('crypto')
const Booking = require('../models/Booking')
const { protect } = require('../middleware/auth')

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET
})

// GET /api/bookings/slots?hospitalId=x&testName=MRI&date=2025-06-15
// Returns array of booked time strings for that day
router.get('/slots', async (req, res) => {
  try {
    const { hospitalId, testName, date } = req.query
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const booked = await Booking.find({
      hospital: hospitalId,
      testName,
      slot: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    }).select('slot')

    const bookedTimes = booked.map(b =>
      new Date(b.slot).toTimeString().slice(0, 5)
    )
    res.json({ bookedTimes })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/bookings/create-order — Step 1 of payment
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body
    const order = await rzp.orders.create({
      amount: amount * 100,  // rupees → paise
      currency: 'INR',
      receipt: 'booking_' + Date.now()
    })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/bookings/verify — Step 2: verify payment + save booking
router.post('/verify', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      hospitalId,
      testName,
      testPrice,
      slot
    } = req.body

    // Verify signature — NEVER skip this
    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(sign)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    // Save booking to DB
    const booking = await Booking.create({
      user: req.user.id,
      hospital: hospitalId,
      testName,
      testPrice,
      slot: new Date(slot),
      status: 'confirmed',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    })

    res.status(201).json({ booking })
  } catch (err) {
    // Duplicate slot error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This slot is already booked' })
    }
    res.status(500).json({ message: err.message })
  }
})

// GET /api/bookings/my — user's own bookings
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('hospital', 'name address phone')
      .sort({ createdAt: -1 })
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router