const express = require('express');
const router = express.Router();
const CategoriaCompeticion = require('../../../models/calendario/competiciones/CategoriaCompeticion');

// GET all categorías
router.get('/', async (req, res) => {
    try {
        const categorias = await CategoriaCompeticion.find();
        res.json(categorias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET categoría by ID
router.get('/:id', async (req, res) => {
    try {
        const categoria = await CategoriaCompeticion.findById(req.params.id);
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
        res.json(categoria);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new categoría
router.post('/', async (req, res) => {
    const categoria = new CategoriaCompeticion({
        nombre_categoria: req.body.nombre_categoria
    });
    try {
        const newCategoria = await categoria.save();
        res.status(201).json(newCategoria);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update categoría
router.put('/:id', async (req, res) => {
    try {
        const categoria = await CategoriaCompeticion.findById(req.params.id);
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });

        categoria.nombre_categoria = req.body.nombre_categoria;
        const updatedCategoria = await categoria.save();
        res.json(updatedCategoria);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE categoría
router.delete('/:id', async (req, res) => {
    try {
        const categoria = await CategoriaCompeticion.findById(req.params.id);
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });

        await categoria.deleteOne();
        res.json({ message: 'Categoría eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
