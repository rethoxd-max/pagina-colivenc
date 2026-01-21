const express = require('express');
const router = express.Router();
const Categoria = require('../../models/ranking/Categoria');
const { inicializarCategorias } = require('../../utils/categoriaUtils');

// GET all categorias
router.get('/', async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ orden: 1, nombre_categoria: 1 });
        res.json(categorias);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST inicializar categorías con los valores por defecto
router.post('/inicializar', async (req, res) => {
    try {
        const categoriasExistentes = await Categoria.countDocuments();
        
        if (categoriasExistentes > 0 && !req.body.forzar) {
            return res.status(400).json({ 
                message: 'Ya existen categorías. Use forzar: true para reinicializar.' 
            });
        }
        
        // Si se fuerza, eliminar las existentes primero
        if (req.body.forzar) {
            await Categoria.deleteMany({});
        }
        
        await inicializarCategorias();
        
        const categorias = await Categoria.find().sort({ orden: 1 });
        res.status(201).json({ 
            message: 'Categorías inicializadas correctamente',
            categorias: categorias
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST actualizar categorías existentes con los campos nuevos (tipo, offsets, etc.)
router.post('/actualizar-campos', async (req, res) => {
    try {
        const actualizaciones = [
            { nombre: 'Sub10', tipo: 'formacion', offset_edad_min: 8, offset_edad_max: 9, orden: 1 },
            { nombre: 'Sub12', tipo: 'formacion', offset_edad_min: 10, offset_edad_max: 11, orden: 2 },
            { nombre: 'Sub14', tipo: 'formacion', offset_edad_min: 12, offset_edad_max: 13, orden: 3 },
            { nombre: 'Sub16', tipo: 'formacion', offset_edad_min: 14, offset_edad_max: 15, orden: 4 },
            { nombre: 'Sub18', tipo: 'formacion', offset_edad_min: 16, offset_edad_max: 17, orden: 5 },
            { nombre: 'Sub20', tipo: 'formacion', offset_edad_min: 18, offset_edad_max: 19, orden: 6 },
            { nombre: 'Sub23', tipo: 'formacion', offset_edad_min: 20, offset_edad_max: 22, orden: 7 },
            { nombre: 'Absoluto', tipo: 'formacion', offset_edad_min: 23, offset_edad_max: 34, orden: 8 },
            { nombre: 'M35', tipo: 'master', edad_min: 35, edad_max: 39, orden: 9 },
            { nombre: 'M40', tipo: 'master', edad_min: 40, edad_max: 44, orden: 10 },
            { nombre: 'M45', tipo: 'master', edad_min: 45, edad_max: 49, orden: 11 },
            { nombre: 'M50', tipo: 'master', edad_min: 50, edad_max: 54, orden: 12 },
            { nombre: 'M55', tipo: 'master', edad_min: 55, edad_max: 59, orden: 13 },
            { nombre: 'M60', tipo: 'master', edad_min: 60, edad_max: 64, orden: 14 },
            { nombre: 'M65', tipo: 'master', edad_min: 65, edad_max: 69, orden: 15 },
            { nombre: 'M70', tipo: 'master', edad_min: 70, edad_max: 74, orden: 16 },
            { nombre: 'M75', tipo: 'master', edad_min: 75, edad_max: 79, orden: 17 },
            { nombre: 'M80', tipo: 'master', edad_min: 80, edad_max: 84, orden: 18 },
            { nombre: 'M85', tipo: 'master', edad_min: 85, edad_max: 89, orden: 19 },
            { nombre: 'M90', tipo: 'master', edad_min: 90, edad_max: null, orden: 20 },
        ];

        const resultados = [];

        for (const act of actualizaciones) {
            const resultado = await Categoria.findOneAndUpdate(
                { nombre_categoria: { $regex: new RegExp(`^${act.nombre}$`, 'i') } },
                { 
                    $set: {
                        tipo: act.tipo,
                        offset_edad_min: act.offset_edad_min,
                        offset_edad_max: act.offset_edad_max,
                        edad_min: act.edad_min,
                        edad_max: act.edad_max,
                        orden: act.orden
                    }
                },
                { new: true }
            );
            
            if (resultado) {
                resultados.push({ categoria: act.nombre, actualizada: true });
            } else {
                // Si no existe, crearla
                const nueva = new Categoria({
                    nombre_categoria: act.nombre,
                    tipo: act.tipo,
                    offset_edad_min: act.offset_edad_min,
                    offset_edad_max: act.offset_edad_max,
                    edad_min: act.edad_min,
                    edad_max: act.edad_max,
                    orden: act.orden
                });
                await nueva.save();
                resultados.push({ categoria: act.nombre, creada: true });
            }
        }

        const categorias = await Categoria.find().sort({ orden: 1 });
        res.json({ 
            message: 'Categorías actualizadas correctamente',
            resultados,
            categorias
        });
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
        await categoria.deleteOne();
        res.json({ message: 'Categoría eliminada' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
