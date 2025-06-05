const mongoose = require('mongoose');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');
const fs = require('fs');
const path = require('path');
require('../config/database');

const warsawVenues = [
  { name: 'Stadion Narodowy', address: 'al. Księcia J. Poniatowskiego 1' },
  { name: 'Torwar', address: 'ul. Łazienkowska 6A' },
  { name: 'Teatr Wielki - Opera Narodowa', address: 'pl. Teatralny 1' },
  { name: 'Teatr Roma', address: 'ul. Nowogrodzka 49' },
  { name: 'Klub Stodoła', address: 'ul. Batorego 10' },
  { name: 'Palladium', address: 'ul. Złota 9' },
  { name: 'Progresja', address: 'ul. Fort Wola 22' },
  { name: 'Kino Muranów', address: 'ul. Gen. Andersa 5' },
  { name: 'Multikino Złote Tarasy', address: 'ul. Złota 59' },
  { name: 'Teatr Polski', address: 'ul. Karasia 2' },
  { name: 'Teatr Dramatyczny', address: 'pl. Defilad 1' },
  { name: 'Centrum Sztuki Współczesnej Zamek Ujazdowski', address: 'ul. Jazdów 2' },
  { name: 'Hala Torwar', address: 'ul. Łazienkowska 6A' },
  { name: 'NIEBO', address: 'ul. Nowy Świat 21' },
  { name: 'Teatr Komedia', address: 'ul. Słowackiego 19a' },
  { name: 'COS Torwar', address: 'ul. Łazienkowska 6A' },
  { name: 'Klub Hybrydy', address: 'ul. Złota 7/9' },
  { name: 'Teatr Capitol', address: 'ul. Marszałkowska 115' },
  { name: 'Kinoteka', address: 'pl. Defilad 1' },
  { name: 'Klub Proxima', address: 'ul. Żwirki i Wigury 99a' }
];

const eventTitles = {
  concert: [
    'Koncert Dawida Podsiadło',
    'Męskie Granie 2023',
    'Sanah - Poezyje Tour',
    'Brodka Live',
    'Daria Zawiałow - Wojny i Noce',
    'Kwiat Jabłoni - Mogło być nic',
    'Taco Hemingway - Jarmark',
    'Quebonafide - Romantic Psycho'
  ],
  theater: [
    'Hamlet - premiera',
    'Dziady - spektakl',
    'Kordian - przedstawienie',
    'Balladyna - spektakl',
    'Wesele - premiera',
    'Rewizor - komedia',
    'Proces - adaptacja'
  ],
  cinema: [
    'Festiwal Filmowy Nowe Horyzonty',
    'Maraton Filmów Oscarowych',
    'Pokaz specjalny: Kino polskie',
    'Przegląd filmów Bergmana',
    'Noc Horrorów',
    'Kino Letnie w Warszawie'
  ],
  sport: [
    'Mecz Polska - Niemcy',
    'Turniej tenisowy Warsaw Open',
    'Maraton Warszawski',
    'Zawody lekkoatletyczne',
    'Mistrzostwa Polski w siatkówce',
    'Wyścig kolarski Tour de Pologne'
  ],
  other: [
    'Targi książki',
    'Festiwal Kultury Azjatyckiej',
    'Warsaw Comic Con',
    'Festiwal Nauki',
    'Noc Muzeów',
    'Warsaw Food Festival'
  ]
};

const eventDescriptions = {
  concert: 'Wyjątkowy koncert w sercu Warszawy. Artysta zaprezentuje zarówno swoje największe hity, jak i utwory z najnowszej płyty. Nie przegap tego niezapomnianego muzycznego wydarzenia!',
  theater: 'Spektakl teatralny w gwiazdorskiej obsadzie. Innowacyjna reżyseria, wspaniała scenografia i kostiumy. Przedstawienie, które na długo pozostanie w pamięci widzów.',
  cinema: 'Wyjątkowy pokaz filmowy połączony z dyskusją z twórcami. Wydarzenie dla wszystkich miłośników dobrego kina, którzy cenią sobie ambitne produkcje i ciekawe rozmowy o sztuce filmowej.',
  sport: 'Emocjonujące sportowe widowisko na najwyższym poziomie. Przyjdź i dopinguj swoich faworytów w tym niezwykłym wydarzeniu, które przyciągnie fanów sportu z całej Polski.',
  other: 'Wyjątkowe wydarzenie kulturalne, które oferuje uczestnikom niezapomniane wrażenia i możliwość poszerzenia horyzontów. Atrakcje dla osób w każdym wieku.'
};

const getEventImages = () => {
  const eventsDir = path.join(__dirname, '../../public/images/events');
  const fallbackImages = [
    'images/event-1.jpg',
    'images/event-2.jpg',
    'images/event-3.jpg',
    'images/event-4.jpg'
  ];
  try {
    if (fs.existsSync(eventsDir)) {
      const files = fs.readdirSync(eventsDir);
      if (files.length > 0) {
        return files.map(file => `images/events/${file}`);
      }
    }
  } catch (error) {
  }
  return fallbackImages;
};

const getCategoryImages = (category) => {
  const eventsDir = path.join(__dirname, '../../public/images/events');
  const fallbackImages = [
    'images/event-1.jpg',
    'images/event-2.jpg',
    'images/event-3.jpg',
    'images/event-4.jpg'
  ];
  try {
    if (fs.existsSync(eventsDir)) {
      const categoryImages = fs.readdirSync(eventsDir)
        .filter(file => file.startsWith(`${category}-`));
      if (categoryImages.length > 0) {
        return categoryImages.map(file => `images/events/${file}`);
      }
    }
  } catch (error) {
  }
  return fallbackImages;
};

const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomFutureDate = () => {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + Math.floor(Math.random() * 90));
  futureDate.setHours(18 + Math.floor(Math.random() * 4));
  futureDate.setMinutes(Math.random() > 0.5 ? 0 : 30);
  return futureDate;
};

const generateTickets = async (event) => {
  const tickets = [];
  const { ticketConfig } = event;
  for (const sector of ticketConfig.sectors) {
    for (let rowNum = 1; rowNum <= ticketConfig.rowsPerSector; rowNum++) {
      const rowLetter = String.fromCharCode(64 + rowNum);
      for (let seatNum = 1; seatNum <= ticketConfig.seatsPerRow; seatNum++) {
        let ticketType;
        if (rowNum <= Math.ceil(ticketConfig.rowsPerSector * 0.2)) {
          ticketType = 'premium';
        } else if (rowNum <= Math.ceil(ticketConfig.rowsPerSector * 0.5)) {
          ticketType = 'vip';
        } else {
          ticketType = 'standard';
        }
        if (!ticketConfig.types.get(ticketType)?.available) {
          continue;
        }
        const ticket = new Ticket({
          event: event._id,
          sector,
          seat: {
            row: rowLetter,
            number: seatNum
          },
          type: ticketType,
          price: ticketConfig.types.get(ticketType).price,
          status: 'available'
        });
        tickets.push(ticket);
      }
    }
  }
  if (tickets.length > 0) {
    await Ticket.insertMany(tickets);
    console.log(`Created ${tickets.length} tickets for event: ${event.title}`);
  }
  return tickets.length;
};

const createEvents = async () => {
  try {
    await Event.deleteMany({});
    await Ticket.deleteMany({});
    console.log('Deleted existing events and tickets');
    const categories = ['concert', 'theater', 'cinema', 'sport', 'other'];
    const events = [];
    for (let i = 0; i < 15; i++) {
      const category = categories[i % categories.length];
      const venue = getRandomElement(warsawVenues);
      const title = getRandomElement(eventTitles[category]);
      const categoryImages = getCategoryImages(category);
      const image = getRandomElement(categoryImages);
      let basePrice;
      if (category === 'concert') {
        basePrice = 80 + Math.floor(Math.random() * 120);
      } else if (category === 'theater') {
        basePrice = 60 + Math.floor(Math.random() * 90);
      } else if (category === 'sport') {
        basePrice = 70 + Math.floor(Math.random() * 130);
      } else if (category === 'cinema') {
        basePrice = 30 + Math.floor(Math.random() * 20);
      } else {
        basePrice = 40 + Math.floor(Math.random() * 60);
      }
      if (venue.name.includes('Narodowy') || venue.name.includes('Wielki')) {
        basePrice *= 1.5;
      }
      const ticketTypes = new Map([
        ['standard', { price: basePrice, available: true }],
        ['vip', { price: Math.round(basePrice * 1.8), available: Math.random() > 0.2 }],
        ['premium', { price: Math.round(basePrice * 2.5), available: Math.random() > 0.5 }]
      ]);
      const ticketConfig = {
        types: ticketTypes,
        sectors: ['A', 'B', 'C'],
        rowsPerSector: 5 + Math.floor(Math.random() * 5),
        seatsPerRow: 10 + Math.floor(Math.random() * 10),
        allowSelectSeats: true,
        autoAssignSeats: false,
        maxTicketsPerOrder: 8
      };
      const event = new Event({
        title: `${title} w ${venue.name}`,
        description: `${eventDescriptions[category]} Wydarzenie odbędzie się w ${venue.name}, ${venue.address}, Warszawa.`,
        date: getRandomFutureDate(),
        location: `${venue.name}, ${venue.address}, Warszawa`,
        category,
        image,
        status: 'upcoming',
        ticketConfig
      });
      await event.save();
      console.log(`Created event: ${event.title}`);
      const ticketCount = await generateTickets(event);
      events.push({
        ...event.toObject(),
        ticketCount
      });
    }
    console.log('\nCreated events:');
    events.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title} - ${event.category} - ${new Date(event.date).toLocaleString('pl-PL')} - ${event.ticketCount} tickets`);
    });
    mongoose.disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error creating events:', error);
    mongoose.disconnect();
  }
};

createEvents();
