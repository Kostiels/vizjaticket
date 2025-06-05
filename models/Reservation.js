const mongoose = require('mongoose')

const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'PLN', enum: ['PLN', 'EUR', 'USD'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['credit_card', 'bank_transfer', 'paypal', 'other'], default: 'credit_card' },
  paymentId: { type: String },
  paymentIntentId: { type: String },
  paymentDate: { type: Date },
  status: { type: String, enum: ['temporary', 'confirmed', 'cancelled'], default: 'temporary' },
  reservationCode: { type: String, required: true, unique: true },
  expiresAt: { type: Date },
  exchangeRateDate: { type: Date },
  exchangeRate: { type: Number },
  originalCurrency: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

ReservationSchema.pre('save', function (next) {
  try {
    if (!this.reservationCode) {
      const timestamp = Date.now().toString(36)
      const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
      this.reservationCode = `RS-${timestamp}-${randomString}`
    }

    if (this.isNew) {
      const exp = new Date()
      exp.setMinutes(exp.getMinutes() + 15)
      this.expiresAt = exp
    }

    this.updatedAt = Date.now()
    next()
  } catch (error) {
    next(error)
  }
})

module.exports = mongoose.model('Reservation', ReservationSchema)
