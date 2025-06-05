const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticateJWT, isAdmin, ensureAuthenticated } = require('../middleware/auth')
const eventController = require('../controllers/eventController')
const ticketController = require('../controllers/ticketController')
const reservationController = require('../controllers/reservationController')
const paymentController = require('../controllers/paymentController')

router.post('/auth/register', userController.apiRegisterUser)
router.post('/auth/login', userController.apiLoginUser)
router.get('/user/profile', authenticateJWT, userController.apiGetUserProfile)
router.put('/user/profile', authenticateJWT, userController.apiUpdateUserProfile)
router.post('/user/password', authenticateJWT, userController.apiChangePassword)

router.get('/events', eventController.apiGetEvents)
router.get('/events/:id', eventController.apiGetEventById)
router.post('/events', authenticateJWT, isAdmin, eventController.apiCreateEvent)
router.put('/events/:id', authenticateJWT, isAdmin, eventController.apiUpdateEvent)
router.delete('/events/:id', authenticateJWT, isAdmin, eventController.apiDeleteEvent)

router.get('/events/:id/tickets', ticketController.apiGetTicketsForEvent)
router.post('/events/:id/tickets', authenticateJWT, isAdmin, ticketController.apiCreateTickets)
router.put('/tickets/:id', authenticateJWT, isAdmin, ticketController.apiUpdateTicket)
router.delete('/tickets/:id', authenticateJWT, isAdmin, ticketController.apiDeleteTicket)

router.get('/reservations', authenticateJWT, reservationController.apiGetUserReservations)
router.get('/reservations/:id', authenticateJWT, reservationController.apiGetReservationById)
router.post('/reservations', authenticateJWT, reservationController.apiCreateReservation)
router.delete('/reservations/:id', authenticateJWT, reservationController.apiCancelReservation)

router.post('/payments/simple-payment/:reservationId', ensureAuthenticated, paymentController.simplePayment)

module.exports = router
