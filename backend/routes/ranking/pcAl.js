const express = require('express');
const router = express.Router();
const PcALModel = require('../../models/ranking/PcAL'); // Renombrado para evitar conflictos

// GET all PcAL
router.get('/', async (req, res) => {
    try {
        const pcALList = await PcALModel.find();
        res.json(pcALList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET PcAL by ID
router.get('/:id', async (req, res) => {
    try {
        const pcAL = await PcALModel.findById(req.params.id);
        if (!pcAL) return res.status(404).json({ message: 'PcAL no encontrado' });
        res.json(pcAL);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new PcAL
router.post('/', async (req, res) => {
    const newPcAL = new PcALModel({  // Renombrado para evitar conflictos
        PcAL: req.body.PcAL // Asegúrate de que el campo coincida con tu modelo
    });
    try {
        const savedPcAL = await newPcAL.save();
        res.status(201).json(savedPcAL);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE all PcAL
router.delete('/', async (req, res) => {
    try {
        await PcALModel.deleteMany({});
        res.json({ message: 'Todos los PcAL eliminados' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE PcAL by ID
router.delete('/:id', async (req, res) => {
    try {
        const pcAL = await PcALModel.findById(req.params.id);
        if (!pcAL) return res.status(404).json({ message: 'PcAL no encontrado' });
        await pcAL.remove();
        res.json({ message: 'PcAL eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
