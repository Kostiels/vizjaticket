const axios = require('axios');
const API_KEY = '5ae7501e677a426eb30756f63d0f8c0c';
const API_URL = 'https://api.ipgeolocation.io/ipgeo';
const DEFAULT_LOCATION = {
  city: 'Warszawa',
  country: 'Poland',
  countryCode: 'PL',
  region: 'Mazowieckie',
  latitude: '52.2298',
  longitude: '21.0118'
};

function isLocalIp(ip) {
  if (!ip) return true;
  return ip === '127.0.0.1' || 
         ip === 'localhost' || 
         ip === '::1' || 
         ip === '0:0:0:0:0:0:0:1' ||
         ip.startsWith('10.') || 
         ip.startsWith('192.168.') || 
         ip.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./);
}

exports.getGeolocation = async (ip = null, fields = null) => {
  try {
    if (isLocalIp(ip) && process.env.NODE_ENV !== 'production') {
      return {
        ip: ip || '127.0.0.1',
        city: DEFAULT_LOCATION.city,
        country_name: DEFAULT_LOCATION.country,
        country_code2: DEFAULT_LOCATION.countryCode,
        state_prov: DEFAULT_LOCATION.region,
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude
      };
    }

    const params = { apiKey: API_KEY };
    if (ip) params.ip = ip;
    if (fields && Array.isArray(fields) && fields.length > 0) {
      params.fields = fields.join(',');
    }

    const response = await axios.get(API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('IP Geolocation API error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    if (process.env.NODE_ENV !== 'production') {
      return {
        ip: ip || '127.0.0.1',
        city: DEFAULT_LOCATION.city,
        country_name: DEFAULT_LOCATION.country,
        country_code2: DEFAULT_LOCATION.countryCode,
        state_prov: DEFAULT_LOCATION.region,
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude
      };
    }
    throw error;
  }
};

exports.getCity = async (ip = null) => {
  try {
    const data = await exports.getGeolocation(ip, ['geo']);
    return data.city || null;
  } catch (error) {
    console.error('Error getting city from IP:', error.message);
    return null;
  }
};

exports.getLocationDetails = async (ip = null) => {
  try {
    const data = await exports.getGeolocation(ip, ['geo']);
    return {
      city: data.city || null,
      country: data.country_name || null,
      countryCode: data.country_code2 || null,
      region: data.state_prov || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null
    };
  } catch (error) {
    console.error('Error getting location details from IP:', error.message);
    if (process.env.NODE_ENV !== 'production') {
      return DEFAULT_LOCATION;
    }
    return {
      city: null,
      country: null,
      countryCode: null,
      region: null,
      latitude: null,
      longitude: null
    };
  }
};

exports.getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.headers['cf-connecting-ip'] || 
         req.headers['true-client-ip'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         '127.0.0.1';
};
