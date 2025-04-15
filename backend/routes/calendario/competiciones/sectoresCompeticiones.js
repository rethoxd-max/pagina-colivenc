const express = require('express');
const router = express.Router();
const SectorCompeticion = require('../../../models/calendario/competiciones/SectorCompeticion');

// GET all sectores
router.get('/', async (req, res) => {
    try {
        const sectores = await SectorCompeticion.find();
        res.json(sectores);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET sector by ID
router.get('/:id', async (req, res) => {
    try {
        const sector = await SectorCompeticion.findById(req.params.id);
        if (!sector) return res.status(404).json({ message: 'Sector no encontrado' });
        res.json(sector);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new sector
router.post('/', async (req, res) => {
    const sector = new SectorCompeticion({
        nombre_sector: req.body.nombre_sector
    });
    try {
        const newSector = await sector.save();
        res.status(201).json(newSector);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE all sectores
router.delete('/', async (req, res) => {
    try {
        await SectorCompeticion.deleteMany({});
        res.json({ message: 'Todos los sectores eliminados' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE sector by ID
router.delete('/:id', async (req, res) => {
    try {
        const sector = await SectorCompeticion.findById(req.params.id);
        if (!sector) return res.status(404).json({ message: 'Sector no encontrado' });
        await sector.remove();
        res.json({ message: 'Sector eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
