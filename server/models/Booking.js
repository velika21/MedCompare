const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  testName: { type: String, required: true },
  testPrice: { type: Number, required: true },
  slot: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  notes: { type: String }
}, { timestamps: true })

// Prevents two bookings for same hospital+test+slot
bookingSchema.index(
  { hospital: 1, testName: 1, slot: 1 },
  { unique: true }
)

module.exports = mongoose.model('Booking', bookingSchema)