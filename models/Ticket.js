const mongoose = require('mongoose')

const TicketSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  type: { type: String, required: true, enum: ['standard', 'vip', 'premium'] },
  price: { type: Number, required: true },
  currency: { type: String, default: 'PLN', enum: ['PLN', 'EUR', 'USD'] },
  sector: { type: String, required: true },
  seat: {
    row: { type: String, required: true },
    number: { type: Number, required: true }
  },
  status: { type: String, enum: ['available', 'reserved', 'sold', 'cancelled'], default: 'available' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

TicketSchema.index({ event: 1, status: 1 })
TicketSchema.index({ event: 1, sector: 1, 'seat.row': 1, 'seat.number': 1 }, { unique: true })
TicketSchema.index({ event: 1, type: 1 })
TicketSchema.index({ event: 1, sector: 1 })
TicketSchema.index({ status: 1 })
TicketSchema.index({ type: 1 })

TicketSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('Ticket', TicketSchema)
