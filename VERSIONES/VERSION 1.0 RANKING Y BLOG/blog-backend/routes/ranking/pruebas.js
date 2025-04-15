const express = require('express');
const router = express.Router();
const Prueba = require('../../models/ranking/Prueba');

// GET all pruebas
router.get('/', async (req, res) => {
  try {
    const pruebas = await Prueba.find().populate('sector_id');
    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/sector/:sector_id', async (req, res) => {
  try {
    const pruebas = await Prueba.find({ sector_id: req.params.sector_id }).populate('sector_id');
    if (!pruebas || pruebas.length === 0) {
      return res.status(404).json({ message: 'No se encontraron pruebas para este sector' });
    }
    res.json(pruebas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET prueba by ID
router.get('/:id', async (req, res) => {
  try {
    const prueba = await Prueba.findById(req.params.id).populate('sector_id');
    if (!prueba) return res.status(404).json({ message: 'Prueba no encontrada' });
    res.json(prueba);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new prueba
router.post('/', async (req, res) => {
  const prueba = new Prueba({
    nombre_prueba: req.body.nombre_prueba,
    sector_id: req.body.sector_id
  });
  try {
    const newPrueba = await prueba.save();
    res.status(201).json(newPrueba);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE all pruebas
router.delete('/', async (req, res) => {
  try {
    await Prueba.deleteMany({});
    res.json({ message: 'Todas las pruebas eliminadas' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE prueba by ID
router.delete('/:id', async (req, res) => {
  try {
    const prueba = await Prueba.findById(req.params.id);
    if (!prueba) return res.status(404).json({ message: 'Prueba no encontrada' });
    await prueba.remove();
    res.json({ message: 'Prueba eliminada' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
