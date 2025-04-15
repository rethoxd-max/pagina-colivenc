const express = require('express');
const router = express.Router();
const Competicion = require('../../models/calendario/competicion');
const auth = require('../../middleware/auth'); // Autenticación si es necesario
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Configuración de multer para almacenar imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/competiciones'); // Carpeta donde se almacenarán las imágenes
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para el archivo
    }
});

const upload = multer({ storage: storage });

// Base URL para las imágenes (reemplaza si estás en producción)
const BASE_URL = 'http://localhost:5000';

// Obtener todas las competiciones
router.get('/', async (req, res) => {
    try {
        const competiciones = await Competicion.find().sort({ fecha: 1 }); // Ordenar por fecha ascendente
        res.json(competiciones);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener una competición específica por ID
router.get('/:id', async (req, res) => {
    try {
        const competicion = await Competicion.findById(req.params.id);
        if (!competicion) {
            return res.status(404).json({ msg: 'Competición no encontrada' });
        }
        res.json(competicion);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});

// Añadir una nueva competición
const ObjectId = require('mongoose').Types.ObjectId;

router.post('/', auth, upload.single('image'), async (req, res) => {
    const { nombre, fecha, lugar, descripcion, tipo, pruebas, categorias } = req.body;

    // Convertir las pruebas a un array de ObjectId
    let pruebaIds;
    try {
        pruebaIds = pruebas.map(id => new ObjectId(id));
    } catch (error) {
        return res.status(400).json({ message: 'Invalid ObjectId format for pruebas' });
    }

    let categoriaIds;
    try {
        categoriaIds = categorias.map(id => new ObjectId(id));
    } catch (error) {
        return res.status(400).json({ message: 'Invalid ObjectId format for categoriase' });
    }

    // Imagen
    const imageUrl = req.file ? `${BASE_URL}/uploads/competiciones/${req.file.filename}` : null;

    const competicion = new Competicion({
        nombre,
        fecha,
        lugar,
        descripcion,
        tipo,
        imageUrl,
        pruebas: pruebaIds,
        categorias: categoriaIds,
    });

    try {
        const nuevaCompeticion = await competicion.save();
        res.status(201).json(nuevaCompeticion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


// Editar una competición (ruta protegida)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    const { nombre, fecha, lugar, descripcion, tipo, imageUrl, pruebas, categorias } = req.body;

    try {
        const competicion = await Competicion.findById(req.params.id);
        if (!competicion) {
            return res.status(404).json({ msg: 'Competición no encontrada' });
        }

        // Actualizar los datos de la competición
        competicion.nombre = nombre || competicion.nombre;
        competicion.fecha = fecha || competicion.fecha;
        competicion.lugar = lugar || competicion.lugar;
        competicion.descripcion = descripcion || competicion.descripcion;
        competicion.tipo = tipo || competicion.tipo;
        competicion.pruebas = pruebas;
        competicion.categorias = categorias;
        competicion.imageUrl = imageUrl

        // Si hay una nueva imagen, eliminar la antigua (si existe) y actualizar
        if (req.file) {
            if (competicion.imageUrl) {
                const oldImagePath = path.join(__dirname, '..', competicion.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath); // Eliminar el archivo de la imagen anterior
                }
            }
            competicion.imageUrl = `${BASE_URL}/uploads/competiciones/${req.file.filename}`;
        }

        await competicion.save();
        res.json(competicion);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});

// Eliminar una competición (ruta protegida)
router.delete('/:id', auth, async (req, res) => {
    try {
        const competicion = await Competicion.findById(req.params.id);
        if (!competicion) {
            return res.status(404).json({ msg: 'Competición no encontrada' });
        }

        // Eliminar la imagen asociada si existe
        if (competicion.imageUrl) {
            const imagePath = path.join(__dirname, '..', competicion.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Eliminar la imagen del servidor
            }
        }

        await competicion.deleteOne();
        res.status(200).json({ msg: 'Competición eliminada' });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor', error: err.message });
    }
});

module.exports = router;
