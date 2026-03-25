const fetch = require('node-fetch');
const db    = require('../models/db');

// Search city by name via Nominatim
async function searchCity(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q (query) is required' });

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=1`;
    const r   = await fetch(url, {
      headers: { 'User-Agent': 'LocAI/1.0', 'Accept-Language': 'en' },
    });
    const data = await r.json();

    if (!data.length) return res.status(404).json({ error: 'City not found' });

    const place  = data[0];
    const result = {
      lat:     parseFloat(place.lat),
      lng:     parseFloat(place.lon),
      city:    place.address?.city || place.address?.town || place.address?.village || place.display_name.split(',')[0],
      country: place.address?.country || '',
      display: place.display_name,
    };

    await db.getDB();
    db.saveSearch({ query: q, ...result });

    res.json(result);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Geocoding failed' });
  }
}

// Coordinates → city name
async function reverseGeocode(req, res) {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const r   = await fetch(url, { headers: { 'User-Agent': 'LocAI/1.0', 'Accept-Language': 'en' } });
    const d   = await r.json();
    const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || d.address?.state || 'Unknown';

    await db.getDB();
    db.saveSearch({ query: `${lat},${lng}`, lat: parseFloat(lat), lng: parseFloat(lng), city, country: d.address?.country });

    res.json({ city, country: d.address?.country || '', display: d.display_name });
  } catch (err) {
    res.status(500).json({ error: 'Reverse geocode failed' });
  }
}

// Retry helper with exponential backoff
async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const r = await fetch(url, options);
      if (r.ok) return r;
      
      // Retry on 503, 504, 429 (temporary errors)
      if ([429, 503, 504].includes(r.status)) {
        const delay = Math.pow(2, i) * 1000; // exponential backoff
        console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms (status: ${r.status})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      return r;
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      const delay = Math.pow(2, i) * 1000;
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms (error: ${err.message})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Nearby places via Overpass API (proxied to avoid CORS on frontend)
async function nearbyPlaces(req, res) {
  const { lat, lng, radius = 900 } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    const query = `[out:json][timeout:15];(node["amenity"](around:${radius},${lat},${lng});node["shop"]["name"](around:700,${lat},${lng});node["tourism"](around:${radius},${lat},${lng}););out body 50;`;
    const r = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
      method:  'POST',
      body:    query,
      headers: { 'Content-Type': 'text/plain' },
    });
    
    if (!r.ok) {
      throw new Error(`Overpass API returned ${r.status}: ${r.statusText}`);
    }
    
    const contentType = r.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await r.text();
      throw new Error(`Expected JSON, got ${contentType || 'unknown'}: ${text.substring(0, 100)}`);
    }
    
    const data = await r.json();

    const places = (data.elements || [])
      .filter(e => e.tags?.name)
      .map(e => {
        const dist = Math.round(
          Math.hypot(
            (e.lat - parseFloat(lat)) * 111000,
            (e.lon - parseFloat(lng)) * 111000 * Math.cos(parseFloat(lat) * Math.PI / 180)
          )
        );
        return { id: e.id, name: e.tags.name, type: e.tags.amenity || e.tags.shop || e.tags.tourism || 'place', lat: e.lat, lng: e.lon, dist };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 40);

    res.json({ places, total: places.length });
  } catch (err) {
    console.error('Nearby error:', err);
    res.status(503).json({ error: 'Overpass API unavailable. Try again in a moment.' });
  }
}

// Weather via Open-Meteo (free, no key needed)
async function weather(req, res) {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,weather_code&wind_speed_unit=kmh&timezone=auto`;
    const r   = await fetch(url);
    const d   = await r.json();
    res.json(d);
  } catch (err) {
    res.status(500).json({ error: 'Weather fetch failed' });
  }
}

// DB stats
async function stats(req, res) {
  try {
    await db.getDB();
    res.json({ ...db.getStats(), recentSearches: db.getRecentSearches(10) });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed' });
  }
}

module.exports = { searchCity, reverseGeocode, nearbyPlaces, weather, stats };
