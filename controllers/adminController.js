const Event = require('../models/Event')
const Ticket = require('../models/Ticket')
const Reservation = require('../models/Reservation')
const fs = require('fs')
const path = require('path')

exports.dashboard = (req, res) => {
  res.render('admin/dashboard', {
    title: 'Panel administratora'
  })
}

exports.listEvents = async (req, res) => {
  const events = await Event.find().sort({ date: 1 })
  res.render('admin/events/index', {
    title: 'Zarządzanie wydarzeniami',
    events
  })
}

exports.createEventForm = (req, res) => {
  res.render('admin/events/create', {
    title: 'Nowe wydarzenie'
  })
}

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, category, status } = req.body
    
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
    
    if (status) {
      eventData.status = status
    }
    
    await Event.create(eventData)
    req.flash('success_msg', 'Wydarzenie utworzono pomyślnie')
    res.redirect('/admin/events')
  } catch (error) {
    console.error('Error creating event:', error)
    req.flash('error_msg', 'Błąd podczas tworzenia wydarzenia')
    res.redirect('/admin/events/create')
  }
}

exports.editEventForm = async (req, res) => {
  const event = await Event.findById(req.params.id)
  if (!event) {
    req.flash('error_msg', 'Wydarzenie nie istnieje')
    return res.redirect('/admin/events')
  }
  res.render('admin/events/edit', {
    title: 'Edycja wydarzenia',
    event
  })
}

exports.editEvent = async (req, res) => {
  try {
    const { title, description, date, location, category, status, activeTab } = req.body
    const event = await Event.findById(req.params.id)
    
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje')
      return res.redirect('/admin/events')
    }
    
    if (req.file) {
      if (event.image !== 'default-event.jpg' && !event.image.includes('event-')) {
        const oldImagePath = path.join(__dirname, '../../public', event.image)
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath)
        }
      }
      event.image = `uploads/events/${req.file.filename}`
    }
    
    event.title = title
    event.description = description
    event.date = date
    event.location = location
    event.category = category
    
    if (status) {
      event.status = status
    }
    
    await event.save()
    req.flash('success_msg', 'Wydarzenie zaktualizowano pomyślnie')
    
    if (activeTab === 'tickets') {
      return res.redirect(`/admin/events/${req.params.id}/edit#tickets-tab`)
    }
    
    res.redirect('/admin/events')
  } catch (error) {
    console.error('Error updating event:', error)
    req.flash('error_msg', 'Błąd podczas aktualizacji wydarzenia')
    res.redirect(`/admin/events/${req.params.id}/edit`)
  }
}

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje')
      return res.redirect('/admin/events')
    }
    
    const ticketsWithReservations = await Ticket.exists({
      event: event._id,
      status: { $in: ['reserved', 'sold'] }
    })
    
    if (ticketsWithReservations) {
      req.flash('error_msg', 'Nie można usunąć wydarzenia z aktywnymi rezerwacjami')
      return res.redirect('/admin/events')
    }
    
    if (event.image !== 'default-event.jpg' && event.image.startsWith('uploads/events/')) {
      const imagePath = path.join(__dirname, '../../public', event.image)
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    }
    
    await Ticket.deleteMany({ event: event._id })
    await Event.findByIdAndDelete(event._id)
    
    req.flash('success_msg', 'Wydarzenie usunięto pomyślnie')
    res.redirect('/admin/events')
  } catch (error) {
    console.error('Error deleting event:', error)
    req.flash('error_msg', 'Błąd podczas usuwania wydarzenia')
    res.redirect('/admin/events')
  }
}

exports.listTickets = async (req, res) => {
  try {
    const { event, status, type, sector, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (event) filter.event = event;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (sector) filter.sector = { $regex: sector, $options: 'i' };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tickets = await Ticket.find(filter)
      .populate('event', 'title')
      .sort({ event: 1, sector: 1, 'seat.row': 1, 'seat.number': 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const totalCount = await Ticket.countDocuments(filter);
    const events = await Event.find({}, { title: 1 }).sort({ title: 1 });
    
    res.render('admin/tickets/index', {
      title: 'Zarządzanie biletami',
      tickets,
      events,
      totalCount,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / parseInt(limit)),
      limit: parseInt(limit),
      filters: { event, status, type, sector },
      req: req
    });
  } catch (error) {
    console.error('Error loading tickets:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas ładowania biletów');
    res.redirect('/admin');
  }
}

exports.editTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, type, status, sector, row, number } = req.body;
    
    const queryParams = new URLSearchParams(req.query).toString();
    
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      req.flash('error_msg', 'Bilet nie istnieje');
      return res.redirect(`/admin/tickets${queryParams ? '?' + queryParams : ''}`);
    }
    
    if (price) ticket.price = parseFloat(price);
    if (type) ticket.type = type;
    if (status) ticket.status = status;
    if (sector) ticket.sector = sector;
    if (row) ticket.seat.row = row;
    if (number) ticket.seat.number = parseInt(number, 10);
    
    await ticket.save();
    
    req.flash('success_msg', 'Bilet został zaktualizowany');
    res.redirect(`/admin/tickets${queryParams ? '?' + queryParams : ''}`);
  } catch (error) {
    console.error('Error editing ticket:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas edycji biletu');
    res.redirect('/admin/tickets');
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      req.flash('error_msg', 'Bilet nie istnieje');
      return res.redirect(`/admin/tickets${queryParams ? '?' + queryParams : ''}`);
    }
    
    if (ticket.status === 'reserved' || ticket.status === 'sold') {
      req.flash('error_msg', 'Nie można usunąć biletu zarezerwowanego lub sprzedanego');
      return res.redirect(`/admin/tickets${queryParams ? '?' + queryParams : ''}`);
    }
    
    await Ticket.findByIdAndDelete(ticket._id);
    
    req.flash('success_msg', 'Bilet usunięto pomyślnie');
    res.redirect(`/admin/tickets${queryParams ? '?' + queryParams : ''}`);
  } catch (error) {
    console.error('Error deleting ticket:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas usuwania biletu');
    res.redirect('/admin/tickets');
  }
}

exports.listReservations = async (req, res) => {
  const reservations = await Reservation.find()
    .populate('event')
    .populate('tickets')
    .populate('user')
    .sort({ createdAt: -1 })
  res.render('admin/reservations/index', {
    title: 'Zarządzanie rezerwacjami',
    reservations
  })
}

exports.cancelReservation = async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
  if (!reservation) {
    req.flash('error_msg', 'Rezerwacja nie istnieje')
    return res.redirect('/admin/reservations')
  }
  if (reservation.paymentStatus === 'paid') {
    req.flash('error_msg', 'Nie można anulować opłaconej rezerwacji')
    return res.redirect('/admin/reservations')
  }
  reservation.status = 'cancelled'
  await reservation.save()
  await Ticket.updateMany(
    { _id: { $in: reservation.tickets } },
    { status: 'available' }
  )
  req.flash('success_msg', 'Rezerwacja została anulowana')
  res.redirect('/admin/reservations')
}

exports.manageEventTickets = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje');
      return res.redirect('/admin/events');
    }
    
    const tickets = await Ticket.find({ event: eventId }).sort({ sector: 1, 'seat.row': 1, 'seat.number': 1 });
    
    const ticketsBySector = {};
    tickets.forEach(ticket => {
      if (!ticketsBySector[ticket.sector]) {
        ticketsBySector[ticket.sector] = [];
      }
      ticketsBySector[ticket.sector].push(ticket);
    });
    
    const totalTickets = tickets.length;
    const availableTickets = tickets.filter(t => t.status === 'available').length;
    const reservedTickets = tickets.filter(t => t.status === 'reserved').length;
    const soldTickets = tickets.filter(t => t.status === 'sold').length;
    
    res.render('admin/events/tickets', {
      title: `Zarządzanie biletami: ${event.title}`,
      event,
      tickets,
      ticketsBySector,
      stats: {
        total: totalTickets,
        available: availableTickets,
        reserved: reservedTickets,
        sold: soldTickets
      }
    });
  } catch (error) {
    console.error('Error managing event tickets:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas ładowania biletów');
    res.redirect('/admin/events');
  }
};

exports.createEventTickets = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { 
      sector, 
      type, 
      price, 
      quantity,
      rowStart,
      rowCount,
      seatsPerRow,
      seatStart,
      currency,
      activeTab
    } = req.body;

    console.log('Creating tickets with data:', req.body);
    
    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje');
      return res.redirect('/admin/events');
    }

    if (quantity) {
      const priceNum = parseFloat(price);
      const quantityNum = parseInt(quantity, 10);
      
      const startCharCode = rowStart ? rowStart.toUpperCase().charCodeAt(0) : 65;
      const ticketsToCreate = [];
      const seatsPerRowNum = event.ticketConfig?.seatsPerRow || 10;
      let currentRow = 0;
      let currentSeat = 1;
      
      for (let i = 0; i < quantityNum; i++) {
        const rowLetter = String.fromCharCode(startCharCode + currentRow);
        const seatNumber = currentSeat;
        
        const existingTicket = await Ticket.findOne({
          event: eventId,
          sector,
          'seat.row': rowLetter,
          'seat.number': seatNumber
        });
        
        if (!existingTicket) {
          ticketsToCreate.push({
            event: eventId,
            type,
            price: priceNum,
            currency: currency || 'PLN',
            sector,
            seat: {
              row: rowLetter,
              number: seatNumber
            },
            status: 'available'
          });
        }
        
        currentSeat++;
        if (currentSeat > seatsPerRowNum) {
          currentSeat = 1;
          currentRow++;
        }
      }
      
      if (ticketsToCreate.length > 0) {
        await Ticket.insertMany(ticketsToCreate);
        req.flash('success_msg', `Dodano ${ticketsToCreate.length} nowych biletów`);
      } else {
        req.flash('info_msg', 'Nie dodano nowych biletów. Możliwe, że wszystkie miejsca już istnieją.');
      }
    } else if (rowCount && seatsPerRow) {
      const priceNum = parseFloat(price);
      const rowCountNum = parseInt(rowCount, 10);
      const seatsPerRowNum = parseInt(seatsPerRow, 10);
      const seatStartNum = parseInt(seatStart || '1', 10);
      const startCharCode = rowStart ? rowStart.charCodeAt(0) : 65;
      const ticketsToCreate = [];
      
      for (let r = 0; r < rowCountNum; r++) {
        const rowLetter = String.fromCharCode(startCharCode + r);
        
        for (let s = 0; s < seatsPerRowNum; s++) {
          const seatNumber = seatStartNum + s;
          
          const existingTicket = await Ticket.findOne({
            event: eventId,
            sector,
            'seat.row': rowLetter,
            'seat.number': seatNumber
          });
          
          if (!existingTicket) {
            ticketsToCreate.push({
              event: eventId,
              type,
              price: priceNum,
              currency: currency || 'PLN',
              sector,
              seat: {
                row: rowLetter,
                number: seatNumber
              },
              status: 'available'
            });
          }
        }
      }
      
      if (ticketsToCreate.length > 0) {
        await Ticket.insertMany(ticketsToCreate);
        req.flash('success_msg', `Dodano ${ticketsToCreate.length} nowych biletów`);
      } else {
        req.flash('info_msg', 'Nie dodano nowych biletów. Możliwe, że wszystkie miejsca już istnieją.');
      }
    }
    
    if (activeTab === 'tickets') {
      return res.redirect(`/admin/events/${eventId}/edit#tickets-tab`);
    }
    
    res.redirect(`/admin/events/${eventId}/tickets`);
  } catch (error) {
    console.error('Error creating event tickets:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas tworzenia biletów: ' + error.message);
    res.redirect(`/admin/events/${req.params.id}/tickets`);
  }
};

exports.manageEventSeating = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);
    
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje');
      return res.redirect('/admin/events');
    }
    
    const tickets = await Ticket.find({ event: eventId }).sort({ sector: 1, 'seat.row': 1, 'seat.number': 1 });
    
    const seatMap = {};
    tickets.forEach(ticket => {
      if (!seatMap[ticket.sector]) {
        seatMap[ticket.sector] = {};
      }
      
      if (!seatMap[ticket.sector][ticket.seat.row]) {
        seatMap[ticket.sector][ticket.seat.row] = [];
      }
      
      seatMap[ticket.sector][ticket.seat.row].push(ticket);
    });
    
    res.render('admin/events/seating', {
      title: `Układ miejsc: ${event.title}`,
      event,
      seatMap,
      tickets
    });
  } catch (error) {
    console.error('Error managing event seating:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas ładowania układu miejsc');
    res.redirect('/admin/events');
  }
};

exports.saveEventSeating = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { seatStatus } = req.body;
    
    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje');
      return res.redirect('/admin/events');
    }
    
    if (seatStatus && typeof seatStatus === 'object') {
      for (const [ticketId, status] of Object.entries(seatStatus)) {
        await Ticket.findByIdAndUpdate(ticketId, { status });
      }
      
      req.flash('success_msg', 'Układ miejsc został zaktualizowany');
    }
    
    res.redirect(`/admin/events/${eventId}/seating`);
  } catch (error) {
    console.error('Error saving event seating:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas zapisywania układu miejsc');
    res.redirect(`/admin/events/${req.params.id}/seating`);
  }
};

exports.saveTicketConfig = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { 
      ticketPrices, 
      ticketAvailability, 
      sectors,
      rowsPerSector,
      seatsPerRow,
      allowSelectSeats,
      autoAssignSeats,
      maxTicketsPerOrder
    } = req.body;

    console.log('Saving ticket config:', req.body);

    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje');
      return res.redirect('/admin/events');
    }

    if (!event.ticketConfig) {
      event.ticketConfig = {};
    }
    
    if (!event.ticketConfig.types) {
      event.ticketConfig.types = new Map();
    }

    const ticketTypes = ['standard', 'vip', 'premium'];
    ticketTypes.forEach(type => {
      const price = parseFloat(ticketPrices?.[type]) || 0;
      const available = !!ticketAvailability?.[type];
      
      console.log(`Setting ${type} ticket: price=${price}, available=${available}`);
      
      event.ticketConfig.types.set(type, {
        price,
        available
      });
    });

    if (sectors) {
      event.ticketConfig.sectors = sectors.split(',').map(s => s.trim());
    }

    if (rowsPerSector) {
      event.ticketConfig.rowsPerSector = parseInt(rowsPerSector, 10);
    }
    
    if (seatsPerRow) {
      event.ticketConfig.seatsPerRow = parseInt(seatsPerRow, 10);
    }
    
    event.ticketConfig.allowSelectSeats = allowSelectSeats === 'on';
    event.ticketConfig.autoAssignSeats = autoAssignSeats === 'on';
    
    if (maxTicketsPerOrder) {
      event.ticketConfig.maxTicketsPerOrder = parseInt(maxTicketsPerOrder, 10);
    }

    console.log('Saving event with ticketConfig:', JSON.stringify(event.ticketConfig));

    await event.save();
    
    req.flash('success_msg', 'Konfiguracja biletów została zapisana');
    res.redirect(`/admin/events/${eventId}/edit#ticket-config-tab`);
  } catch (error) {
    console.error('Error saving ticket configuration:', error);
    req.flash('error_msg', 'Wystąpił błąd podczas zapisywania konfiguracji biletów: ' + error.message);
    res.redirect(`/admin/events/${req.params.id}/edit#ticket-config-tab`);
  }
};
