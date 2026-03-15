const express = require('express');
const router  = express.Router();
const {
  searchCity, reverseGeocode, nearbyPlaces, weather, stats,
} = require('../controllers/locationController');

// GET /api/location/search?q=Mumbai
// GET /api/location/reverse?lat=20.29&lng=85.82
// GET /api/location/nearby?lat=20.29&lng=85.82&radius=900
// GET /api/location/weather?lat=20.29&lng=85.82
// GET /api/location/stats

router.get('/search',  searchCity);
router.get('/reverse', reverseGeocode);
router.get('/nearby',  nearbyPlaces);
router.get('/weather', weather);
router.get('/stats',   stats);

module.exports = router;
