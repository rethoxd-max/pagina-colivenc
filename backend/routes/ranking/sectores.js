const express = require('express');
const router = express.Router();
const Sector = require('../../models/ranking/Sector');
const Marca = require('../../models/ranking/Marca');
const Prueba = require('../../models/ranking/Prueba');
const Atleta = require('../../models/ranking/Atleta');
const mongoose = require('mongoose');

// GET sectores que tienen marcas para una categoría específica
router.get('/por-categoria/:categoriaId', async (req, res) => {
    try {
        const { categoriaId } = req.params;
        const { genero } = req.query;

        if (!mongoose.Types.ObjectId.isValid(categoriaId)) {
            return res.status(400).json({ message: 'ID de categoría no válido.' });
        }

        let pruebasConMarcas;

        if (genero) {
            // Usar aggregation para filtrar por género del atleta
            const resultado = await Marca.aggregate([
                { $match: { categoria: new mongoose.Types.ObjectId(categoriaId) } },
                { $lookup: {
                    from: 'atletas',
                    localField: 'nombre_atleta',
                    foreignField: '_id',
                    as: 'atleta'
                }},
                { $unwind: '$atleta' },
                { $match: { 'atleta.genero': genero } },
                { $group: { _id: '$nombre_prueba' } }
            ]);
            pruebasConMarcas = resultado.map(r => r._id);
        } else {
            // Sin filtro de género, obtener directamente
            pruebasConMarcas = await Marca.distinct('nombre_prueba', { 
                categoria: new mongoose.Types.ObjectId(categoriaId) 
            });
        }

        // Obtener los sectores de esas pruebas
        const pruebas = await Prueba.find({ _id: { $in: pruebasConMarcas } }).lean();
        const sectoresIds = [...new Set(pruebas.map(p => p.sector_id.toString()))];

        // Obtener los detalles de los sectores
        const sectores = await Sector.find({ 
            _id: { $in: sectoresIds } 
        }).sort({ nombre_sector: 1 });

        res.json(sectores);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// GET all sectores
router.get('/', async (req, res) => {
    try {
        const sectores = await Sector.find().sort({ nombre_sector: 1 });
        res.json(sectores);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET sector by ID
router.get('/:id', async (req, res) => {
    try {
        const sector = await Sector.findById(req.params.id);
        if (!sector) return res.status(404).json({ message: 'Sector no encontrado' });
        res.json(sector);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new sector
router.post('/', async (req, res) => {
    const sector = new Sector({
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
        await Sector.deleteMany({});
        res.json({ message: 'Todos los sectores eliminados' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE sector by ID
router.delete('/:id', async (req, res) => {
    try {
        const sector = await Sector.findById(req.params.id);
        if (!sector) return res.status(404).json({ message: 'Sector no encontrado' });
        await sector.deleteOne();
        res.json({ message: 'Sector eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
