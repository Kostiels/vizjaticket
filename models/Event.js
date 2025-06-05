const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  category: { type: String, required: true, enum: ['concert', 'theater', 'cinema', 'sport', 'other'] },
  image: { type: String, default: 'default-event.jpg' },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  ticketConfig: {
    types: {
      type: Map,
      of: new mongoose.Schema({
        price: { type: Number, default: 0 },
        available: { type: Boolean, default: true }
      }, { _id: false })
    },
    sectors: { type: [String], default: ['A', 'B', 'C'] },
    rowsPerSector: { type: Number, default: 5 },
    seatsPerRow: { type: Number, default: 10 },
    allowSelectSeats: { type: Boolean, default: true },
    autoAssignSeats: { type: Boolean, default: false },
    maxTicketsPerOrder: { type: Number, default: 10 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

EventSchema.index({ date: 1 })
EventSchema.index({ status: 1 })
EventSchema.index({ category: 1 })
EventSchema.index({ title: 'text', description: 'text' })

EventSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('Event', EventSchema)
