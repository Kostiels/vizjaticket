const express = require('express')
const router = express.Router()
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth')
const adminController = require('../controllers/adminController')
const upload = require('../middleware/upload')

router.get('/', ensureAuthenticated, ensureAdmin, adminController.dashboard)
router.get('/events', ensureAuthenticated, ensureAdmin, adminController.listEvents)
router.get('/events/create', ensureAuthenticated, ensureAdmin, adminController.createEventForm)
router.post('/events/create', ensureAuthenticated, ensureAdmin, upload.single('image'), adminController.createEvent)
router.get('/events/:id/edit', ensureAuthenticated, ensureAdmin, adminController.editEventForm)
router.post('/events/:id/edit', ensureAuthenticated, ensureAdmin, upload.single('image'), adminController.editEvent)
router.post('/events/:id/delete', ensureAuthenticated, ensureAdmin, adminController.deleteEvent)

router.get('/events/:id/tickets', ensureAuthenticated, ensureAdmin, adminController.manageEventTickets)
router.post('/events/:id/tickets/create', ensureAuthenticated, ensureAdmin, adminController.createEventTickets)
router.post('/events/:id/tickets/config', ensureAuthenticated, ensureAdmin, adminController.saveTicketConfig)
router.get('/events/:id/seating', ensureAuthenticated, ensureAdmin, adminController.manageEventSeating)
router.post('/events/:id/seating/save', ensureAuthenticated, ensureAdmin, adminController.saveEventSeating)

router.get('/tickets', ensureAuthenticated, ensureAdmin, adminController.listTickets)
router.post('/tickets/:id/delete', ensureAuthenticated, ensureAdmin, adminController.deleteTicket)
router.post('/tickets/:id/edit', ensureAuthenticated, ensureAdmin, adminController.editTicket)

router.get('/reservations', ensureAuthenticated, ensureAdmin, adminController.listReservations)
router.post('/reservations/:id/cancel', ensureAuthenticated, ensureAdmin, adminController.cancelReservation)

module.exports = router
