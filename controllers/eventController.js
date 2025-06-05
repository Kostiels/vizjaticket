const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const ipGeolocationAPI = require('../integrations/ipGeolocationAPI');

function parseDateString(dateString) {
  if (!dateString) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return new Date(dateString);
  }

  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  return null;
}

exports.getUpcomingEvents = async function(limit) {
  try {
    const events = await Event.find({
      date: { $gte: new Date() },
      status: { $ne: 'cancelled' }
    })
      .sort({ date: 1 })
      .limit(limit);
    return events;
  } catch (error) {
    return [];
  }
};

exports.getEvents = async (req, res, next) => {
  try {
    const clientIp = ipGeolocationAPI.getClientIp(req);
    let userLocation = null;

    try {
      userLocation = await ipGeolocationAPI.getLocationDetails(clientIp);
    } catch (locationError) {
      // silently ignore
    }

    const {
      category,
      search,
      date_from,
      date_to,
      sort = 'date_asc',
      city: queryCityFilter,
      auto_location
    } = req.query;

    const useAutoLocation = auto_location === 'true' && userLocation && userLocation.city;
    const cityFilter = queryCityFilter || (useAutoLocation ? userLocation.city : null);

    const query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (cityFilter) {
      query.location = { $regex: new RegExp(cityFilter, 'i') };
    }

    if (date_from || date_to) {
      query.date = {};
      if (date_from) {
        const fromDate = parseDateString(date_from);
        if (fromDate) {
          query.date.$gte = fromDate;
        }
      }
      if (date_to) {
        const toDate = parseDateString(date_to);
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
          query.date.$lte = toDate;
        }
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (!query.date) {
      query.date = { $gte: new Date() };
    }

    let sortOptions = {};
    switch (sort) {
      case 'date_desc':
        sortOptions = { date: -1 };
        break;
      case 'title_asc':
        sortOptions = { title: 1 };
        break;
      case 'title_desc':
        sortOptions = { title: -1 };
        break;
      case 'date_asc':
      default:
        sortOptions = { date: 1 };
    }

    const events = await Event.find(query).sort(sortOptions);

    let prioritizedEvents = events;
    let userCityEvents = [];
    let otherEvents = [];

    if (userLocation && userLocation.city) {
      const cityRegex = new RegExp(userLocation.city, 'i');
      userCityEvents = events.filter(event => cityRegex.test(event.location));
      otherEvents = events.filter(event => !cityRegex.test(event.location));

      if (!queryCityFilter && useAutoLocation) {
        prioritizedEvents = [...userCityEvents, ...otherEvents];
      } else {
        prioritizedEvents = events;
      }
    }

    const showUserCityBanner = userLocation && userLocation.city && userCityEvents.length > 0;
    const isFiltered = category || search || date_from || date_to || cityFilter;

    res.render('events/index', {
      title: 'Wydarzenia',
      events: prioritizedEvents,
      userCityEvents,
      otherEvents,
      filters: {
        category,
        search,
        date_from,
        date_to,
        sort,
        city: cityFilter,
        auto_location
      },
      userLocation,
      useAutoLocation,
      showUserCityBanner,
      isFiltered
    });
  } catch (error) {
    next(error);
  }
};

exports.getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      req.flash('error_msg', 'Wydarzenie nie istnieje');
      return res.redirect('/events');
    }

    const tickets = await Ticket.find({
      event: event._id,
      status: 'available'
    });

    const related_events = await Event.find({
      _id: { $ne: event._id },
      category: event.category,
      date: { $gte: new Date() }
    })
      .limit(4);

    const clientIp = ipGeolocationAPI.getClientIp(req);
    let userLocation = null;

    try {
      userLocation = await ipGeolocationAPI.getLocationDetails(clientIp);
    } catch (locationError) {
      // silently ignore
    }

    res.render('events/show', {
      title: event.title,
      event,
      tickets,
      related_events,
      userLocation
    });
  } catch (error) {
    next(error);
  }
};

exports.apiGetEvents = async (req, res) => {
  try {
    const { category, date, search } = req.query;
    let query = {};
    if (category) query.category = category;
    if (date) query.date = { $gte: new Date(date) };
    if (search) query.title = { $regex: search, $options: 'i' };

    const events = await Event.find(query).sort({ date: 1 });
    return res.json({ success: true, data: events });
  } catch (error) {
    console.error('API getEvents error:', error);
    return res.status(500).json({ success: false, error: 'Błąd serwera' });
  }
};

exports.apiGetEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono wydarzenia' });
    }
    const ticketsCount = await Ticket.countDocuments({
      event: event._id,
      status: 'available'
    });
    return res.json({
      success: true,
      data: {
        ...event.toObject(),
        availableTickets: ticketsCount
      }
    });
  } catch (error) {
    console.error('API getEventById error:', error);
    return res.status(500).json({ success: false, error: 'Błąd serwera' });
  }
};

exports.apiCreateEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak uprawnień' });
    }
    const { title, description, date, location, category, image } = req.body;
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      category,
      image: image || 'default-event.jpg'
    });
    await newEvent.save();
    return res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    console.error('API createEvent error:', error);
    return res.status(500).json({ success: false, error: 'Błąd serwera' });
  }
};

exports.apiUpdateEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak uprawnień' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono wydarzenia' });
    }
    const { title, description, date, location, category, image, status } = req.body;
    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (location) event.location = location;
    if (category) event.category = category;
    if (image) event.image = image;
    if (status) event.status = status;
    await event.save();
    return res.json({ success: true, data: event });
  } catch (error) {
    console.error('API updateEvent error:', error);
    return res.status(500).json({ success: false, error: 'Błąd serwera' });
  }
};

exports.apiDeleteEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Brak uprawnień' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Nie znaleziono wydarzenia' });
    }
    const reservedOrSold = await Ticket.exists({
      event: event._id,
      status: { $in: ['reserved', 'sold'] }
    });
    if (reservedOrSold) {
      return res.status(400).json({
        success: false,
        error: 'Wydarzenie ma zarezerwowane bilety'
      });
    }
    await Ticket.deleteMany({ event: event._id });
    await event.remove();
    return res.json({ success: true, message: 'Usunięto wydarzenie' });
  } catch (error) {
    console.error('API deleteEvent error:', error);
    return res.status(500).json({ success: false, error: 'Błąd serwera' });
  }
};
