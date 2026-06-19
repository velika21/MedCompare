const mongoose = require('mongoose')

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },  
  price: { type: Number, required: true },
  duration: { type: String },              
  description: { type: String }
})

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: {
      type: [Number],   
      required: true
    }
  },
  phone: String,
  email: String,
  tests: [testSchema],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  images: [String],
  isVerified: { type: Boolean, default: false },
  openTime: String,     
  closeTime: String     
}, { timestamps: true })

hospitalSchema.index({ location: '2dsphere' })

module.exports = mongoose.model('Hospital', hospitalSchema)