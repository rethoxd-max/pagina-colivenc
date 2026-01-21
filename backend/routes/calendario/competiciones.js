const express = require('express');
const router = express.Router();
const Competicion = require('../../models/calendario/competicion');
const auth = require('../../middleware/auth'); // Autenticación si es necesario
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'competiciones');

// Asegurarse de que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configuración de multer para almacenar imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // límite de 5MB
    }
});

// Obtener todas las competiciones
router.get('/', async (req, res) => {
    try {
        const competiciones = await Competicion.find().sort({ fecha: -1 }); // Ordenar por fecha descendente
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
    try {
        const { nombre, fecha, lugar, descripcion, tipo } = req.body;
        let { pruebas, categorias } = req.body;

        // Parsear pruebas y categorias si vienen como string (multipart/form-data)
        if (typeof pruebas === 'string') {
            try {
                pruebas = JSON.parse(pruebas);
            } catch (e) {
                pruebas = pruebas.split(',').filter(id => id.trim());
            }
        }
        
        if (typeof categorias === 'string') {
            try {
                categorias = JSON.parse(categorias);
            } catch (e) {
                categorias = categorias.split(',').filter(id => id.trim());
            }
        }

        // Asegurar que son arrays
        pruebas = Array.isArray(pruebas) ? pruebas : [];
        categorias = Array.isArray(categorias) ? categorias : [];

        // Convertir las pruebas a un array de ObjectId
        let pruebaIds;
        try {
            pruebaIds = pruebas.filter(id => id && mongoose.Types.ObjectId.isValid(id)).map(id => new ObjectId(id));
        } catch (error) {
            return res.status(400).json({ message: 'Invalid ObjectId format for pruebas' });
        }

        let categoriaIds;
        try {
            categoriaIds = categorias.filter(id => id && mongoose.Types.ObjectId.isValid(id)).map(id => new ObjectId(id));
        } catch (error) {
            return res.status(400).json({ message: 'Invalid ObjectId format for categorias' });
        }

        // Verificar si el archivo se subió correctamente
        if (req.file) {
            const filePath = path.join(UPLOAD_DIR, req.file.filename);
            if (!fs.existsSync(filePath)) {
                return res.status(500).json({ msg: 'Error al guardar la imagen' });
            }
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

        const nuevaCompeticion = await competicion.save();
        res.status(201).json(nuevaCompeticion);
    } catch (err) {
        console.error('Error al crear competición:', err);
        // Si hay un error y se subió un archivo, eliminarlo
        if (req.file) {
            const filePath = path.join(UPLOAD_DIR, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(400).json({ message: err.message });
    }
});

// Editar una competición (ruta protegida)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const competicion = await Competicion.findById(req.params.id);
        if (!competicion) {
            return res.status(404).json({ msg: 'Competición no encontrada' });
        }

        // Actualizar los datos básicos de la competición
        competicion.nombre = req.body.nombre || competicion.nombre;
        competicion.fecha = req.body.fecha || competicion.fecha;
        competicion.lugar = req.body.lugar || competicion.lugar;
        competicion.descripcion = req.body.descripcion || competicion.descripcion;
        competicion.tipo = req.body.tipo || competicion.tipo;

        // Manejar las pruebas y categorías
        if (req.body.pruebas) {
            try {
                if (Array.isArray(req.body.pruebas)) {
                    competicion.pruebas = req.body.pruebas.map(id => new ObjectId(id));
                }
            } catch (error) {
                console.error('Error al procesar pruebas:', error);
            }
        }

        if (req.body.categorias) {
            try {
                if (Array.isArray(req.body.categorias)) {
                    competicion.categorias = req.body.categorias.map(id => new ObjectId(id));
                }
            } catch (error) {
                console.error('Error al procesar categorías:', error);
            }
        }

        // Manejar la imagen
        if (req.file) {
            // Eliminar la imagen anterior si existe
            if (competicion.imageUrl) {
                const oldFilename = competicion.imageUrl.split('/').pop();
                const oldImagePath = path.join(UPLOAD_DIR, oldFilename);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Verificar si la nueva imagen se subió correctamente
            const newFilePath = path.join(UPLOAD_DIR, req.file.filename);
            if (!fs.existsSync(newFilePath)) {
                return res.status(500).json({ msg: 'Error al guardar la nueva imagen' });
            }

            // Actualizar con la nueva imagen
            competicion.imageUrl = `${BASE_URL}/uploads/competiciones/${req.file.filename}`;
        }

        await competicion.save();
        res.json(competicion);
    } catch (error) {
        console.error('Error al actualizar competición:', error);
        // Si hay un error y se subió un archivo, eliminarlo
        if (req.file) {
            const filePath = path.join(UPLOAD_DIR, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
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
            const filename = competicion.imageUrl.split('/').pop();
            const imagePath = path.join(UPLOAD_DIR, filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await competicion.deleteOne();
        res.status(200).json({ msg: 'Competición eliminada' });
    } catch (err) {
        console.error('Error al eliminar competición:', err);
        res.status(500).json({ msg: 'Error en el servidor', error: err.message });
    }
});

module.exports = router;
