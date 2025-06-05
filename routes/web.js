const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController')
const reservationController = require('../controllers/reservationController')
const ticketController = require('../controllers/ticketController')
const userController = require('../controllers/userController')
const { ensureAuthenticated } = require('../middleware/auth')
const Event = require('../models/Event')
const upload = require('../middleware/upload')
const paymentController = require('../controllers/paymentController')
const ipGeolocationAPI = require('../integrations/ipGeolocationAPI')

router.get('/', async (req, res) => {
  try {
    const upcomingEvents = await eventController.getUpcomingEvents(3)
    const clientIp = ipGeolocationAPI.getClientIp(req)
    let userLocation = null
    try {
      userLocation = await ipGeolocationAPI.getLocationDetails(clientIp)
      if (userLocation.city && upcomingEvents.length > 0) {
        const cityRegex = new RegExp(userLocation.city, 'i')
        const localEvents = upcomingEvents.filter(event => cityRegex.test(event.location))
        const otherEvents = upcomingEvents.filter(event => !cityRegex.test(event.location))
        const prioritizedEvents = [...localEvents, ...otherEvents].slice(0, upcomingEvents.length)
        res.render('home', {
          title: 'System rezerwacji biletów',
          upcomingEvents: prioritizedEvents,
          userLocation
        })
        return
      }
    } catch (locationError) {}
    res.render('home', {
      title: 'System rezerwacji biletów',
      upcomingEvents,
      userLocation
    })
  } catch (error) {
    res.render('home', {
      title: 'System rezerwacji biletów',
      upcomingEvents: []
    })
  }
})

router.get('/events/add', (req, res) => {
  res.render('events/add', { title: 'Dodaj nowe wydarzenie' })
})

router.post('/events/add', upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location, category } = req.body
    if (!title || !description || !date || !location || !category) {
      req.flash('error_msg', 'Proszę wypełnić wszystkie wymagane pola')
      return res.redirect('/events/add')
    }
    let imagePath = 'default-event.jpg'
    if (req.file) {
      imagePath = `uploads/events/${req.file.filename}`
    }
    const eventData = {
      title,
      description,
      date,
      location,
      category,
      image: imagePath
    }
    await eventController.createEvent(eventData)
    req.flash('success_msg', 'Wydarzenie zostało dodane pomyślnie')
    res.redirect('/events')
  } catch (error) {
    req.flash('error_msg', 'Wystąpił błąd podczas dodawania wydarzenia')
    res.redirect('/events/add')
  }
})

router.get('/events', (req, res, next) => {
  eventController.getEvents(req, res, next)
})

router.get('/events/:id', eventController.getEventById)
router.get('/events/:id/booking', ticketController.getBookingPage)

router.post('/reservations', ensureAuthenticated, reservationController.createReservation)
router.get('/reservations', ensureAuthenticated, reservationController.getUserReservations)
router.get('/reservations/:id', ensureAuthenticated, reservationController.getReservationById)
router.post('/reservations/:id/cancel', ensureAuthenticated, reservationController.cancelReservation)
router.get('/reservations/:id/success', (req, res) => {
  req.flash('success_msg', 'Płatność zrealizowana')
  res.redirect('/reservations/' + req.params.id)
})

router.get('/user/login', (req, res) => {
  res.render('user/login', { title: 'Logowanie' })
})
router.post('/user/login', userController.loginUser)
router.get('/user/register', (req, res) => {
  res.render('user/register', { title: 'Rejestracja' })
})
router.post('/user/register', userController.registerUser)
router.get('/user/logout', userController.logoutUser)

router.get('/user/profile', ensureAuthenticated, userController.getUserProfile)
router.post('/user/profile', ensureAuthenticated, userController.updateUserProfile)
router.post('/user/password', ensureAuthenticated, userController.changePassword)

router.get('/about', (req, res) => {
  res.render('about', { title: 'O nas' })
})
router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Kontakt' })
})

router.get('/debug/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 })
    res.json({
      totalEvents: events.length,
      currentTime: new Date(),
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        date: event.date,
        isUpcoming: event.date >= new Date(),
        formattedDate: new Date(event.date).toLocaleString()
      }))
    })
  } catch (error) {
    res.status(500).json({ error: 'Error fetching events' })
  }
})

router.get('/reservations/:id/payment', ensureAuthenticated, paymentController.getPaymentPage)
router.get('/payment/success', ensureAuthenticated, paymentController.getPaymentSuccessPage)
router.get('/payment/cancel', ensureAuthenticated, paymentController.getPaymentCancelPage)

module.exports = router
