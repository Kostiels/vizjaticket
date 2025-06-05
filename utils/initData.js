const Event = require('../models/Event')
const User = require('../models/User')

async function seedEvents() {
  const count = await Event.countDocuments()
  if (count === 0) {
    await Event.create([
      {
        title: 'Koncert Testowy',
        description: 'Opis koncertu testowego',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Warszawa, Arena',
        category: 'concert',
        image: 'event-1.jpg'
      },
      {
        title: 'Spektakl Teatralny',
        description: 'Opis spektaklu testowego',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        location: 'Teatr Miejski',
        category: 'theater',
        image: 'event-2.jpg'
      }
    ])
    console.log('Sample events added')
  }

  await seedAdminUser()
}

async function seedAdminUser() {
  const adminCount = await User.countDocuments({ role: 'admin' })
  if (adminCount === 0) {
    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    })
    console.log('Admin account created: admin@example.com / admin123')
  }
}

module.exports = seedEvents
