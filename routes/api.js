const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticateJWT, isAdmin, ensureAuthenticated } = require('../middleware/auth')
const eventController = require('../controllers/eventController')
const ticketController = require('../controllers/ticketController')
const reservationController = require('../controllers/reservationController')
const paymentController = require('../controllers/paymentController')

/**
 * @swagger
 * tags:
 *   - name: Autoryzacja
 *     description: API do rejestracji i autoryzacji użytkowników
 *   - name: Użytkownicy
 *     description: API do zarządzania profilami użytkowników
 *   - name: Wydarzenia
 *     description: API do zarządzania wydarzeniami
 *   - name: Bilety
 *     description: API do zarządzania biletami na wydarzenia
 *   - name: Rezerwacje
 *     description: API do zarządzania rezerwacjami biletów
 *   - name: Płatności
 *     description: API do przetwarzania płatności
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Rejestracja nowego użytkownika
 *     tags: [Autoryzacja]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nazwa użytkownika
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email użytkownika
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Hasło użytkownika
 *     responses:
 *       201:
 *         description: Użytkownik został pomyślnie zarejestrowany
 *       400:
 *         description: Błąd walidacji lub użytkownik już istnieje
 */
router.post('/auth/register', userController.apiRegisterUser)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logowanie użytkownika
 *     tags: [Autoryzacja]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email użytkownika
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Hasło użytkownika
 *     responses:
 *       200:
 *         description: Pomyślne logowanie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT do autoryzacji
 *                 user:
 *                   type: object
 *                   description: Informacje o użytkowniku
 *       401:
 *         description: Nieprawidłowe dane uwierzytelniające
 */
router.post('/auth/login', userController.apiLoginUser)

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Pobieranie profilu użytkownika
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pomyślne pobranie profilu
 *       401:
 *         description: Nieautoryzowany
 */
router.get('/user/profile', authenticateJWT, userController.apiGetUserProfile)

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Aktualizacja profilu użytkownika
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nowa nazwa użytkownika
 *               phone:
 *                 type: string
 *                 description: Nowy telefon użytkownika
 *     responses:
 *       200:
 *         description: Profil został pomyślnie zaktualizowany
 *       401:
 *         description: Nieautoryzowany
 */
router.put('/user/profile', authenticateJWT, userController.apiUpdateUserProfile)

/**
 * @swagger
 * /api/user/password:
 *   post:
 *     summary: Zmiana hasła użytkownika
 *     tags: [Użytkownicy]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Aktualne hasło użytkownika
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: Nowe hasło użytkownika
 *     responses:
 *       200:
 *         description: Hasło zostało pomyślnie zmienione
 *       401:
 *         description: Nieautoryzowany lub nieprawidłowe aktualne hasło
 */
router.post('/user/password', authenticateJWT, userController.apiChangePassword)

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Pobieranie listy wydarzeń
 *     tags: [Wydarzenia]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numer strony
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Liczba elementów na stronie
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtr według kategorii
 *     responses:
 *       200:
 *         description: Lista wydarzeń
 */
router.get('/events', eventController.apiGetEvents)

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Pobieranie informacji o wydarzeniu według ID
 *     tags: [Wydarzenia]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID wydarzenia
 *     responses:
 *       200:
 *         description: Informacje o wydarzeniu
 *       404:
 *         description: Wydarzenie nie zostało znalezione
 */
router.get('/events/:id', eventController.apiGetEventById)

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Tworzenie nowego wydarzenia
 *     tags: [Wydarzenia]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - location
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tytuł wydarzenia
 *               description:
 *                 type: string
 *                 description: Opis wydarzenia
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Data i godzina wydarzenia
 *               location:
 *                 type: string
 *                 description: Miejsce wydarzenia
 *               category:
 *                 type: string
 *                 description: Kategoria wydarzenia
 *               image:
 *                 type: string
 *                 description: URL obrazu wydarzenia
 *     responses:
 *       201:
 *         description: Wydarzenie zostało pomyślnie utworzone
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 */
router.post('/events', authenticateJWT, isAdmin, eventController.apiCreateEvent)

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Aktualizacja wydarzenia
 *     tags: [Wydarzenia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID wydarzenia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tytuł wydarzenia
 *               description:
 *                 type: string
 *                 description: Opis wydarzenia
 *               date:
 *                 type: string
 *                 format: date-time
 *                 description: Data i godzina wydarzenia
 *               location:
 *                 type: string
 *                 description: Miejsce wydarzenia
 *               category:
 *                 type: string
 *                 description: Kategoria wydarzenia
 *               image:
 *                 type: string
 *                 description: URL obrazu wydarzenia
 *     responses:
 *       200:
 *         description: Wydarzenie zostało pomyślnie zaktualizowane
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Wydarzenie nie zostało znalezione
 */
router.put('/events/:id', authenticateJWT, isAdmin, eventController.apiUpdateEvent)

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Usuwanie wydarzenia
 *     tags: [Wydarzenia]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID wydarzenia
 *     responses:
 *       200:
 *         description: Wydarzenie zostało pomyślnie usunięte
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Wydarzenie nie zostało znalezione
 */
router.delete('/events/:id', authenticateJWT, isAdmin, eventController.apiDeleteEvent)

/**
 * @swagger
 * /api/events/{id}/tickets:
 *   get:
 *     summary: Pobieranie biletów dla wydarzenia
 *     tags: [Bilety]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID wydarzenia
 *     responses:
 *       200:
 *         description: Lista biletów
 *       404:
 *         description: Wydarzenie nie zostało znalezione
 */
router.get('/events/:id/tickets', ticketController.apiGetTicketsForEvent)

/**
 * @swagger
 * /api/events/{id}/tickets:
 *   post:
 *     summary: Tworzenie biletów dla wydarzenia
 *     tags: [Bilety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID wydarzenia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - price
 *               - quantity
 *             properties:
 *               type:
 *                 type: string
 *                 description: Typ biletu
 *               price:
 *                 type: number
 *                 description: Cena biletu
 *               quantity:
 *                 type: integer
 *                 description: Ilość dostępnych biletów
 *     responses:
 *       201:
 *         description: Bilety zostały pomyślnie utworzone
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Wydarzenie nie zostało znalezione
 */
router.post('/events/:id/tickets', authenticateJWT, isAdmin, ticketController.apiCreateTickets)

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: Aktualizacja biletu
 *     tags: [Bilety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID biletu
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Typ biletu
 *               price:
 *                 type: number
 *                 description: Cena biletu
 *               quantity:
 *                 type: integer
 *                 description: Ilość dostępnych biletów
 *     responses:
 *       200:
 *         description: Bilet został pomyślnie zaktualizowany
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Bilet nie został znaleziony
 */
router.put('/tickets/:id', authenticateJWT, isAdmin, ticketController.apiUpdateTicket)

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Usuwanie biletu
 *     tags: [Bilety]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID biletu
 *     responses:
 *       200:
 *         description: Bilet został pomyślnie usunięty
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Bilet nie został znaleziony
 */
router.delete('/tickets/:id', authenticateJWT, isAdmin, ticketController.apiDeleteTicket)

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Pobieranie rezerwacji użytkownika
 *     tags: [Rezerwacje]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista rezerwacji
 *       401:
 *         description: Nieautoryzowany
 */
router.get('/reservations', authenticateJWT, reservationController.apiGetUserReservations)

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Pobieranie rezerwacji według ID
 *     tags: [Rezerwacje]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID rezerwacji
 *     responses:
 *       200:
 *         description: Informacje o rezerwacji
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Rezerwacja nie została znaleziona
 */
router.get('/reservations/:id', authenticateJWT, reservationController.apiGetReservationById)

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Tworzenie nowej rezerwacji
 *     tags: [Rezerwacje]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *               - quantity
 *             properties:
 *               ticketId:
 *                 type: string
 *                 description: ID biletu
 *               quantity:
 *                 type: integer
 *                 description: Ilość biletów do rezerwacji
 *     responses:
 *       201:
 *         description: Rezerwacja została pomyślnie utworzona
 *       400:
 *         description: Błąd walidacji lub niewystarczająca ilość biletów
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Bilet nie został znaleziony
 */
router.post('/reservations', authenticateJWT, reservationController.apiCreateReservation)

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Anulowanie rezerwacji
 *     tags: [Rezerwacje]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID rezerwacji
 *     responses:
 *       200:
 *         description: Rezerwacja została pomyślnie anulowana
 *       401:
 *         description: Nieautoryzowany
 *       403:
 *         description: Brak uprawnień
 *       404:
 *         description: Rezerwacja nie została znaleziona
 */
router.delete('/reservations/:id', authenticateJWT, reservationController.apiCancelReservation)

/**
 * @swagger
 * /api/payments/simple-payment/{reservationId}:
 *   post:
 *     summary: Realizacja prostej płatności
 *     tags: [Płatności]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID rezerwacji
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *             properties:
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, transfer, paypal]
 *                 description: Metoda płatności
 *     responses:
 *       200:
 *         description: Płatność została pomyślnie zrealizowana
 *       400:
 *         description: Błąd walidacji
 *       401:
 *         description: Nieautoryzowany
 *       404:
 *         description: Rezerwacja nie została znaleziona
 */
router.post('/payments/simple-payment/:reservationId', ensureAuthenticated, paymentController.simplePayment)

module.exports = router
