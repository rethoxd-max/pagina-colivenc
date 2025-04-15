const express = require('express');
const router = express.Router();
const Atleta = require('../../models/ranking/Atleta');


// GET all atletas
router.get('/', async (req, res) => {
  try {
    const atletas = await Atleta.find();
    res.json(atletas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET atleta by ID
router.get('/:id', async (req, res) => {
  try {
    const atleta = await Atleta.findById(req.params.id);
    if (!atleta) return res.status(404).json({ message: 'Atleta no encontrado' });
    res.json(atleta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new atleta
router.post('/', async (req, res) => {
  const atleta = new Atleta({
    nombre: req.body.nombre,
    fecha_nacimiento: req.body.fecha_nacimiento
  });
  try {
    const newAtleta = await atleta.save();
    res.status(201).json(newAtleta);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE all atletas
router.delete('/', async (req, res) => {
  try {
    await Atleta.deleteMany({});
    res.json({ message: 'Todos los atletas eliminados' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE atleta by ID
router.delete('/:id', async (req, res) => {
  try {
    const atleta = await Atleta.findById(req.params.id);
    if (!atleta) return res.status(404).json({ message: 'Atleta no encontrado' });
    await atleta.remove();
    res.json({ message: 'Atleta eliminado' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
