const express = require('express');
const router = express.Router();
const Categoria = require('../../models/ranking/Categoria');

// GET all categorias
router.get('/', async (req, res) => {
    try {
        const categorias = await Categoria.find();
        res.json(categorias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET categoria by ID
router.get('/:id', async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
        res.json(categoria);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new categoria
router.post('/', async (req, res) => {
    const categoria = new Categoria({
        nombre_categoria: req.body.nombre_categoria
    });
    try {
        const newCategoria = await categoria.save();
        res.status(201).json(newCategoria);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE all categorias
router.delete('/', async (req, res) => {
    try {
        await Categoria.deleteMany({});
        res.json({ message: 'Todas las categorías eliminadas' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE categoria by ID
router.delete('/:id', async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
        await categoria.remove();
        res.json({ message: 'Categoría eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
