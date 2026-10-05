const express = require('express');
const router = express.Router();
const tugasController = require('../controllers/tugasController');
const auth = require('../middleware/auth');

// Seluruh rute tugas wajib login: data selalu dalam lingkup req.user.id
router.use(auth);

// Definisi route REST API /api/tugas
router.get('/', tugasController.getAll);
router.get('/:id', tugasController.getById);
router.post('/', tugasController.create);
router.put('/:id', tugasController.update);
router.patch('/:id/toggle', tugasController.toggle);
router.delete('/:id', tugasController.remove);

module.exports = router;
