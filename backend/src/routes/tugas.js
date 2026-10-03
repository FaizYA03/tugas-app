const express = require('express');
const router = express.Router();
const tugasController = require('../controllers/tugasController');

// Definisi route REST API /api/tugas
router.get('/', tugasController.getAll);
router.get('/:id', tugasController.getById);
router.post('/', tugasController.create);
router.put('/:id', tugasController.update);
router.patch('/:id/toggle', tugasController.toggle);
router.delete('/:id', tugasController.remove);

module.exports = router;
