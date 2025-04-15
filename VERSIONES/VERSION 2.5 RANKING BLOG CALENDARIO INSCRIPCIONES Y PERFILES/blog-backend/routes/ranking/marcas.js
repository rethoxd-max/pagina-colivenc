const express = require('express');
const router = express.Router();
const Marca = require('../../models/ranking/Marca');

// GET all marcas
router.get('/', async (req, res) => {
    try {
        const marcas = await Marca.find().populate('nombre_atleta nombre_prueba categoria');
        res.json(marcas);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// GET marca by ID
router.get('/:id', async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id).populate('nombre_atleta nombre_prueba categoria');
        if (!marca) return res.status(404).json({ message: 'Marca no encontrada' });
        res.json(marca);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new marca
router.post('/', async (req, res) => {
    const marca = new Marca({
        nombre_atleta: req.body.nombre_atleta,
        nombre_prueba: req.body.nombre_prueba,
        horas: req.body.horas,
        minutos: req.body.minutos,
        segundos: req.body.segundos,
        metros: req.body.metros,
        puntos: req.body.puntos,
        lugar: req.body.lugar,
        viento: req.body.viento,
        comentario: req.body.comentario,
        categoria: req.body.categoria,
        anyo: req.body.anyo,
        fecha_realizacion: req.body.fecha_realizacion,
        PcAL: req.body.PcAL,
    });
    try {
        const newMarca = await marca.save();
        res.status(201).json(newMarca);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Actualizar una marca
router.put('/:id', async (req, res) => {
    try {
        const marca = await Marca.findById(req.params.id);
        if (!marca) return res.status(404).json({ message: 'Marca no encontrada' });

        // Actualizar campos
        Object.assign(marca, req.body);
        await marca.save();

        res.json(marca);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// DELETE all marcas
router.delete('/', async (req, res) => {
    try {
        await Marca.deleteMany({});
        res.json({ message: 'Todas las marcas eliminadas' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE marca by ID
router.delete('/:id', async (req, res) => {
    try {
        const marca = await Marca.findByIdAndDelete(req.params.id);
        if (!marca) return res.status(404).json({ message: 'Marca no encontrada' });
        res.json({ message: 'Marca eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;
