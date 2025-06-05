const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { promisify } = require('util');

const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
};

const downloadImage = async (url, imagePath) => {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(imagePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error.message);
    throw error;
  }
};

const imageUrls = {
  concert: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1000',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1000',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?q=80&w=1000'
  ],
  theater: [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1000',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?q=80&w=1000',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1000'
  ],
  cinema: [
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1000',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=1000',
    'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1000'
  ],
  sport: [
    'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?q=80&w=1000',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1000',
    'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=1000'
  ],
  other: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000',
    'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1000',
    'https://images.unsplash.com/photo-1560523159-4a9692d222f9?q=80&w=1000'
  ]
};

const downloadImages = async () => {
  try {
    const imagesDir = path.join(__dirname, '../../public/images/events');
    createDirIfNotExists(imagesDir);
    
    console.log('Downloading event images...');
    
    for (const [category, urls] of Object.entries(imageUrls)) {
      console.log(`Downloading ${category} images...`);
      
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const imageName = `${category}-${i + 1}.jpg`;
        const imagePath = path.join(imagesDir, imageName);
        
        console.log(`Downloading ${url} to ${imagePath}`);
        await downloadImage(url, imagePath);
        console.log(`Downloaded ${imageName}`);
      }
    }
    
    console.log('All images downloaded successfully!');
  } catch (error) {
    console.error('Error downloading images:', error);
  }
};

downloadImages();
