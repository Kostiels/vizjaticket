  const mongoose = require('mongoose')

  
  const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, 
    minPoolSize: 2, 
    socketTimeoutMS: 45000, 
    family: 4, 
    serverSelectionTimeoutMS: 5000, 
    heartbeatFrequencyMS: 10000, 
  }

  
  if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', false)
  }

  mongoose.connect('mongodb://127.0.0.1:27017/ticket_reservation', connectionOptions)
    .then(() => {
      console.log('Connected to MongoDB')
    })
    .catch(err => {
      console.error('MongoDB connection error:', err)
    })

  module.exports = mongoose
