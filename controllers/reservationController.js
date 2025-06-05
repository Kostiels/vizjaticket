const Reservation = require('../models/Reservation')
const Ticket = require('../models/Ticket')
const Event = require('../models/Event')
const mongoose = require('mongoose')

exports.getUserReservations = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }

    const filter = {
      status: req.query.status || '',
      sort: req.query.sort || 'date_desc'
    }

    const query = { user: req.user._id }
    if (filter.status) {
      query.status = filter.status
    }

    let sortOptions = {}
    switch (filter.sort) {
      case 'date_asc':
        sortOptions = { createdAt: 1 }
        break
      case 'event_date_asc':
        sortOptions = { 'event.date': 1 }
        break
      case 'event_date_desc':
        sortOptions = { 'event.date': -1 }
        break
      case 'date_desc':
      default:
        sortOptions = { createdAt: -1 }
    }

    let reservations = await Reservation.find(query)
      .populate('event')
      .populate('tickets')

    if (filter.sort === 'event_date_asc' || filter.sort === 'event_date_desc') {
      const direction = filter.sort === 'event_date_asc' ? 1 : -1
      reservations.sort((a, b) => {
        if (!a.event || !b.event) return 0
        if (!a.event.date) return 1
        if (!b.event.date) return -1
        return direction * (new Date(a.event.date) - new Date(b.event.date))
      })
    } else {
      reservations.sort((a, b) => {
        const direction = filter.sort === 'date_asc' ? 1 : -1
        return direction * (new Date(a.createdAt) - new Date(b.createdAt))
      })
    }

    res.render('reservations/index', {
      title: 'Moje rezerwacje',
      reservations,
      filter
    })
  } catch (error) {
    console.error('Error in getUserReservations:', error)
    req.flash('error_msg', 'Błąd przy wczytywaniu rezerwacji')
    res.redirect('/')
  }
}

exports.getReservationById = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }
    const reservation = await Reservation.findById(req.params.id)
      .populate('event')
      .populate('tickets')
    if (!reservation) {
      req.flash('error_msg', 'Rezerwacja nie istnieje')
      return res.redirect('/reservations')
    }
    if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error_msg', 'Brak uprawnień')
      return res.redirect('/reservations')
    }
    res.render('reservations/show', {
      title: 'Rezerwacja #' + reservation.reservationCode,
      reservation
    })
  } catch (error) {
    req.flash('error_msg', 'Błąd przy wczytywaniu rezerwacji')
    res.redirect('/reservations')
  }
}

exports.createReservation = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }

    const { eventId, ticketIds, currency } = req.body

    console.log('Creating reservation with:', { eventId, ticketIds, currency, userId: req.user._id })

    if (!eventId || !ticketIds) {
      console.error('Missing eventId or ticketIds')
      req.flash('error_msg', 'Brak wymaganych danych')
      return res.redirect('/events')
    }

    const ticketIdsArray = Array.isArray(ticketIds) ? ticketIds : [ticketIds]
    const filteredTicketIds = ticketIdsArray.filter(id => id && id.trim() !== '')

    if (filteredTicketIds.length === 0) {
      console.error('No valid ticket IDs provided')
      req.flash('error_msg', 'Nie wybrano biletów')
      return res.redirect('/events/' + eventId)
    }

    try {
      console.log('Converting IDs to ObjectId')
      const eventObjectId = new mongoose.Types.ObjectId(eventId)
      const ticketObjectIds = []

      for (const id of filteredTicketIds) {
        try {
          ticketObjectIds.push(new mongoose.Types.ObjectId(id))
        } catch (err) {
          console.error(`Error converting ticket ID ${id} to ObjectId:`, err)
          throw new Error(`Invalid ticket ID format: ${id}`)
        }
      }

      console.log('Finding tickets and checking availability')
      const tickets = await Ticket.find({
        _id: { $in: ticketObjectIds },
        status: 'available'
      })

      console.log(`Found ${tickets.length} available tickets out of ${filteredTicketIds.length} requested`)

      if (tickets.length !== filteredTicketIds.length) {
        console.error(`Found ${tickets.length} tickets, expected ${filteredTicketIds.length}`)
        req.flash('error_msg', 'Niektóre wybrane bilety nie są już dostępne')
        return res.redirect('/events/' + eventId + '/booking')
      }

      const uniqueEvents = [...new Set(tickets.map(t => t.event.toString()))]
      if (uniqueEvents.length !== 1 || uniqueEvents[0] !== eventId) {
        console.error('Tickets belong to different events or not the selected event')
        req.flash('error_msg', 'Bilety należą do różnych wydarzeń')
        return res.redirect('/events')
      }

      const validCurrency = ['PLN', 'EUR', 'USD'].includes(currency) ? currency : 'PLN'
      console.log(`Using currency: ${validCurrency}`)

      const nbpAPI = require('../integrations/nbpAPI')

      let totalAmount = 0
      let exchangeRateInfo = null

      const allTicketsInRequestedCurrency = tickets.every(ticket => ticket.currency === validCurrency)

      if (allTicketsInRequestedCurrency) {
        totalAmount = tickets.reduce((sum, ticket) => sum + ticket.price, 0)
        console.log(`All tickets already in ${validCurrency}, total price: ${totalAmount}`)
      } else {
        console.log('Getting exchange rates from NBP API for currency conversion')
        let exchangeRates
        try {
          exchangeRates = await nbpAPI.getExchangeRates()
          console.log('Exchange rates successfully retrieved:', exchangeRates.date)

          if (validCurrency !== 'PLN') {
            exchangeRateInfo = {
              date: exchangeRates.date,
              rate: exchangeRates.rates[validCurrency].rate,
              originalCurrency: 'PLN'
            }
          }
        } catch (error) {
          console.error('Error getting exchange rates:', error)
          req.flash('error_msg', 'Błąd podczas pobierania kursów walut. Spróbuj ponownie.')
          return res.redirect('/events/' + eventId + '/booking')
        }

        for (const ticket of tickets) {
          try {
            if (ticket.currency === validCurrency) {
              totalAmount += ticket.price
            } else {
              const fromRate = exchangeRates.rates[ticket.currency || 'PLN'].rate
              const toRate = exchangeRates.rates[validCurrency].rate

              let convertedAmount
              if (ticket.currency === 'PLN') {
                convertedAmount = ticket.price / toRate
              } else if (validCurrency === 'PLN') {
                convertedAmount = ticket.price * fromRate
              } else {
                convertedAmount = ticket.price * fromRate / toRate
              }

              convertedAmount = Math.round(convertedAmount * 100) / 100
              totalAmount += convertedAmount
              console.log(`Converted ${ticket.price} ${ticket.currency} to ${convertedAmount} ${validCurrency}`)

              if (!exchangeRateInfo && ticket.currency === 'PLN') {
                exchangeRateInfo = {
                  date: exchangeRates.date,
                  rate: toRate,
                  originalCurrency: 'PLN'
                }
              }
            }
          } catch (conversionError) {
            console.error('Error during price conversion:', conversionError)
            totalAmount += ticket.price
          }
        }

        totalAmount = Math.round(totalAmount * 100) / 100
      }

      console.log(`Final total price in ${validCurrency}: ${totalAmount}`)

      const timestamp = Date.now().toString(36)
      const randomString = Math.random().toString(36).substring(2, 8).toUpperCase()
      const reservationCode = `RS-${timestamp}-${randomString}`
      console.log(`Generated reservation code: ${reservationCode}`)

      console.log('Creating reservation object')
      const reservationData = {
        user: req.user._id,
        event: eventObjectId,
        tickets: ticketObjectIds,
        totalPrice: totalAmount,
        currency: validCurrency,
        status: 'temporary',
        paymentStatus: 'pending',
        reservationCode: reservationCode
      }

      if (exchangeRateInfo) {
        reservationData.exchangeRateDate = new Date(exchangeRateInfo.date)
        reservationData.exchangeRate = exchangeRateInfo.rate
        reservationData.originalCurrency = exchangeRateInfo.originalCurrency
      }

      const reservation = new Reservation(reservationData)

      console.log('Validating reservation schema')
      const validationError = reservation.validateSync()
      if (validationError) {
        console.error('Validation error:', validationError)
        throw new Error(`Validation error: ${validationError.message}`)
      }

      console.log('Saving reservation')
      const savedReservation = await reservation.save()
      console.log(`Reservation saved with ID: ${savedReservation._id}`)

      console.log('Updating ticket statuses to reserved')
      const updateResult = await Ticket.updateMany(
        { _id: { $in: ticketObjectIds } },
        { $set: { status: 'reserved' } }
      )

      console.log(`Updated ticket statuses: ${JSON.stringify(updateResult)}`)
      console.log(`Reservation ${savedReservation._id} created successfully`)
      req.flash('success_msg', 'Rezerwacja została utworzona pomyślnie')
      res.redirect('/reservations')
    } catch (innerError) {
      console.error('Detailed error during reservation creation:', innerError)
      throw innerError
    }
  } catch (error) {
    console.error('Error creating reservation:', error)
    req.flash('error_msg', `Wystąpił błąd podczas tworzenia rezerwacji: ${error.message}`)
    res.redirect('/events')
  }
}

exports.getPaymentPage = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }
    const reservation = await Reservation.findById(req.params.id)
      .populate('event')
      .populate('tickets')
    if (!reservation) {
      req.flash('error_msg', 'Rezerwacja nie istnieje')
      return res.redirect('/reservations')
    }
    if (reservation.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Brak uprawnień')
      return res.redirect('/reservations')
    }
    if (reservation.isExpired) {
      req.flash('error_msg', 'Rezerwacja wygasła')
      return res.redirect('/reservations')
    }
    res.render('reservations/payment', {
      title: 'Płatność rezerwacji',
      reservation
    })
  } catch (error) {
    req.flash('error_msg', 'Błąd płatności')
    res.redirect('/reservations')
  }
}

exports.cancelReservation = async (req, res) => {
  try {
    if (!req.user) {
      req.flash('error_msg', 'Musisz się zalogować')
      return res.redirect('/user/login')
    }
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) {
      req.flash('error_msg', 'Rezerwacja nie istnieje')
      return res.redirect('/reservations')
    }
    if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error_msg', 'Brak uprawnień')
      return res.redirect('/reservations')
    }
    if (reservation.paymentStatus === 'paid') {
      req.flash('error_msg', 'Nie można anulować opłaconej rezerwacji')
      return res.redirect('/reservations/' + reservation._id)
    }
    reservation.status = 'cancelled'
    await reservation.save()
    await Ticket.updateMany(
      { _id: { $in: reservation.tickets } },
      { status: 'available' }
    )
    req.flash('success_msg', 'Anulowano rezerwację')
    res.redirect('/reservations')
  } catch (error) {
    req.flash('error_msg', 'Błąd przy anulowaniu rezerwacji')
    res.redirect('/reservations')
  }
}

exports.apiGetUserReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id })
      .populate('event', 'title date location')
      .populate('tickets', 'type sector seat')
      .sort({ createdAt: -1 })
    res.json({ success: true, data: reservations })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}

exports.apiGetReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('event')
      .populate('tickets')
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono rezerwacji' })
    }
    if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak dostępu' })
    }
    res.json({ success: true, data: reservation })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}

exports.apiCreateReservation = async (req, res) => {
  try {
    const { eventId, ticketIds } = req.body

    if (!eventId || !ticketIds) {
      return res.status(400).json({ success: false, error: 'Brak danych' })
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId)

    const tickets = await Ticket.find({
      _id: { $in: ticketIds },
      status: 'available'
    })

    if (tickets.length !== ticketIds.length) {
      return res.status(400).json({ success: false, error: 'Niektóre bilety są już niedostępne' })
    }

    const uniqueEvents = [...new Set(tickets.map(t => t.event.toString()))]
    if (uniqueEvents.length !== 1 || uniqueEvents[0] !== eventId) {
      return res.status(400).json({ success: false, error: 'Bilety nie pasują do wydarzenia' })
    }

    const totalPrice = tickets.reduce((sum, t) => sum + t.price, 0)

    const reservation = new Reservation({
      user: req.user._id,
      event: eventObjectId,
      tickets: ticketIds,
      totalPrice,
      currency: tickets[0].currency,
      status: 'temporary',
      paymentStatus: 'pending'
    })

    await reservation.save()
    await Ticket.updateMany({ _id: { $in: ticketIds } }, { status: 'reserved' })

    res.status(201).json({ success: true, data: reservation })
  } catch (error) {
    console.error('API Error creating reservation:', error)
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}

exports.apiCancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono rezerwacji' })
    }
    if (reservation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak dostępu' })
    }
    if (reservation.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, error: 'Nie można anulować opłaconej rezerwacji' })
    }
    reservation.status = 'cancelled'
    await reservation.save()
    await Ticket.updateMany({ _id: { $in: reservation.tickets } }, { status: 'available' })
    res.json({ success: true, message: 'Rezerwacja anulowana' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}
