const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Rute publik: pendaftaran & login (dilindungi rate limiter ketat di index.js)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rute privat: profil pengguna aktif
router.get('/me', auth, authController.me);

module.exports = router;
