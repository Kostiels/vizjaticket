const Event = require('../models/Event')
const Ticket = require('../models/Ticket')
const nbpAPI = require('../integrations/nbpAPI')
const mongoose = require('mongoose')

exports.getBookingPage = async (req, res) => {
  try {
    const eventId = req.params.id

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      req.flash('error_msg', 'Nieprawidłowe ID wydarzenia')
      return res.redirect('/events')
    }

    const event = await Event.findById(eventId)
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje')
      return res.redirect('/events')
    }

    const availableTickets = await Ticket.find({
      event: eventId,
      status: 'available'
    })

    if (!availableTickets || availableTickets.length === 0) {
      req.flash('error_msg', 'Brak dostępnych biletów')
      return res.redirect('/events/' + eventId)
    }

    const sectors = {}

    for (const ticket of availableTickets) {
      if (!sectors[ticket.sector]) {
        sectors[ticket.sector] = []
      }

      const ticketForFrontend = {
        id: ticket._id,
        price: ticket.price,
        currency: ticket.currency || 'PLN',
        type: ticket.type,
        status: ticket.status,
        sector: ticket.sector,
        seat: {
          row: ticket.seat.row,
          number: ticket.seat.number
        }
      }

      sectors[ticket.sector].push(ticketForFrontend)
    }

    let exchangeRates = null
    try {
      exchangeRates = await nbpAPI.getExchangeRates()
    } catch (err) {
      exchangeRates = {
        rates: {
          'PLN': { code: 'PLN', name: 'Polski Złoty', rate: 1.0 },
          'EUR': { code: 'EUR', name: 'Euro', rate: 4.3 },
          'USD': { code: 'USD', name: 'Dolar amerykański', rate: 3.9 }
        }
      }
    }

    const ticketTypes = ['standard', 'vip', 'premium']

    res.render('tickets/booking', {
      event,
      sectors,
      ticketTypes,
      exchangeRates,
      tickets: availableTickets
    })
  } catch (error) {
    req.flash('error_msg', 'Błąd podczas ładowania strony rezerwacji')
    return res.redirect('/events')
  }
}

exports.apiGetTicketsForEvent = async (req, res) => {
  try {
    const { sector, type } = req.query
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono wydarzenia' })
    }
    const query = { event: event._id, status: 'available' }
    if (sector) {
      query.sector = sector
    }
    if (type) {
      query.type = type
    }
    const tickets = await Ticket.find(query).sort({ sector: 1, 'seat.row': 1, 'seat.number': 1 })
    res.json({ success: true, data: tickets })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}

exports.apiCreateTickets = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak uprawnień' })
    }
    const event = await Event.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono wydarzenia' })
    }
    const { sector, type, price, currency, quantity, rowStart = 'A', seatStart = 1 } = req.body
    if (!sector || !type || !price || !quantity) {
      return res.status(400).json({ success: false, error: 'Niekompletne dane' })
    }
    const tickets = []
    const baseCode = rowStart.charCodeAt(0)
    for (let i = 0; i < quantity; i++) {
      const r = String.fromCharCode(baseCode + Math.floor(i / 20))
      const seatNum = (i % 20) + parseInt(seatStart)
      const existing = await Ticket.findOne({
        event: event._id,
        sector,
        'seat.row': r,
        'seat.number': seatNum
      })
      if (existing) {
        continue
      }
      const newTicket = new Ticket({
        event: event._id,
        type,
        price,
        currency,
        sector,
        seat: { row: r, number: seatNum },
        status: 'available'
      })
      await newTicket.save()
      tickets.push(newTicket)
    }
    res.status(201).json({ success: true, data: tickets })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}

exports.apiUpdateTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak uprawnień' })
    }
    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono biletu' })
    }
    const { status, price, type } = req.body
    if (status) ticket.status = status
    if (price) ticket.price = price
    if (type) ticket.type = type
    await ticket.save()
    res.json({ success: true, data: ticket })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}

exports.apiDeleteTicket = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak uprawnień' })
    }
    const ticket = await Ticket.findById(req.params.id)
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono biletu' })
    }
    if (ticket.status === 'reserved' || ticket.status === 'sold') {
      return res.status(400).json({ success: false, error: 'Bilet jest zarezerwowany lub sprzedany' })
    }
    await ticket.remove()
    res.json({ success: true, message: 'Usunięto bilet' })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Błąd serwera' })
  }
}
