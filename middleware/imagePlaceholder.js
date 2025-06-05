const path = require('path')
const fs = require('fs')

function createDirs() {
  const dirs = [
    path.join(__dirname, '../../public/images'),
    path.join(__dirname, '../../public/images/events'),
    path.join(__dirname, '../../public/images/avatars'),
    path.join(__dirname, '../../public/images/partners')
  ]
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

function createPlaceholder(fileName, w, h, text) {
  const imagePath = path.join(__dirname, '../../public/images', fileName)
  if (fs.existsSync(imagePath)) {
    return
  }
  const svg = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
<rect width="100%" height="100%" fill="#007BFF"/>
<text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
</svg>
  `.trim()
  fs.writeFileSync(imagePath, svg)
}

function createAll() {
  createPlaceholder('hero-image.jpg', 700, 500, 'Zdjęcie główne')
  createPlaceholder('event-1.jpg', 400, 200, 'Koncert')
  createPlaceholder('event-2.jpg', 400, 200, 'Teatr')
  createPlaceholder('event-3.jpg', 400, 200, 'Sport')
  createPlaceholder('event-4.jpg', 400, 200, 'Kino')
  createPlaceholder('avatar-1.jpg', 60, 60, 'Avatar 1')
  createPlaceholder('avatar-2.jpg', 60, 60, 'Avatar 2')
  createPlaceholder('partner-1.png', 120, 60, 'Partner 1')
  createPlaceholder('partner-2.png', 120, 60, 'Partner 2')
  createPlaceholder('partner-3.png', 120, 60, 'Partner 3')
  createPlaceholder('partner-4.png', 120, 60, 'Partner 4')
  createPlaceholder('partner-5.png', 120, 60, 'Partner 5')
}

function initPlaceholders() {
  createDirs()
  createAll()
}

module.exports = {
  initPlaceholders
}
