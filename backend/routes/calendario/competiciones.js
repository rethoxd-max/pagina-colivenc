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
        fileSize: 15 * 1024 * 1024 // límite de 15MB, para soportar PDFs
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Solo se permiten imágenes o archivos PDF'));
    }
});

// Acepta la imagen principal y hasta 5 archivos adjuntos (para los "enlaces" de tipo archivo)
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'adjuntos', maxCount: 5 }
]);

// Combina los enlaces enviados (URL manual o archivo ya existente) con los ficheros
// recién subidos, en el mismo orden en que el frontend los añadió al FormData.
function resolveEnlaces(enlacesMeta, archivosAdjuntos) {
    const disponibles = [...(archivosAdjuntos || [])];
    const resueltos = [];

    for (const item of enlacesMeta) {
        if (!item || !item.nombre) continue;

        if (item.origen === 'archivo') {
            if (item.nuevoArchivo && disponibles.length > 0) {
                const file = disponibles.shift();
                resueltos.push({
                    nombre: item.nombre,
                    url: `${BASE_URL}/uploads/competiciones/${file.filename}`,
                    origen: 'archivo'
                });
            } else if (item.url) {
                // Archivo ya existente que no se ha reemplazado en esta edición
                resueltos.push({ nombre: item.nombre, url: item.url, origen: 'archivo' });
            }
        } else if (item.url) {
            resueltos.push({ nombre: item.nombre, url: item.url, origen: 'url' });
        }
    }

    return resueltos;
}

// Borra del disco todos los archivos que multer haya guardado en la petición (campos 'image' y 'adjuntos')
function eliminarArchivosSubidos(files) {
    if (!files) return;
    const todos = [...(files.image || []), ...(files.adjuntos || [])];
    todos.forEach(file => {
        const filePath = path.join(UPLOAD_DIR, file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
}

// Obtener todas las competiciones
router.get('/', async (req, res) => {
    try {
        const competiciones = await Competicion.find()
            .populate('disciplina', 'nombre slug color icono')
            .sort({ fecha: -1 }); // Ordenar por fecha descendente
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

router.post('/', auth, (req, res, next) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    next();
}, uploadFields, async (req, res) => {
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

        // Parsear enlaces (mezcla de URLs manuales y archivos subidos)
        let enlacesMeta = [];
        if (req.body.enlaces) {
            try {
                enlacesMeta = JSON.parse(req.body.enlaces);
                if (!Array.isArray(enlacesMeta)) enlacesMeta = [];
            } catch (e) {
                enlacesMeta = [];
            }
        }
        const enlaces = resolveEnlaces(enlacesMeta, req.files && req.files.adjuntos);

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

        const imageFile = req.files && req.files.image && req.files.image[0];

        // Verificar si el archivo se subió correctamente
        if (imageFile) {
            const filePath = path.join(UPLOAD_DIR, imageFile.filename);
            if (!fs.existsSync(filePath)) {
                return res.status(500).json({ msg: 'Error al guardar la imagen' });
            }
        }

        // Imagen
        const imageUrl = imageFile ? `${BASE_URL}/uploads/competiciones/${imageFile.filename}` : null;

        const competicion = new Competicion({
            nombre,
            fecha,
            lugar,
            descripcion,
            tipo,
            imageUrl,
            pruebas: pruebaIds,
            categorias: categoriaIds,
            enlaces,
            disciplina: req.body.disciplina || null,
        });

        const nuevaCompeticion = await competicion.save();
        res.status(201).json(nuevaCompeticion);
    } catch (err) {
        console.error('Error al crear competición:', err);
        // Si hay un error, eliminar todos los archivos subidos en esta petición (imagen + adjuntos)
        eliminarArchivosSubidos(req.files);
        res.status(400).json({ message: err.message });
    }
});

// Editar una competición (ruta protegida)
router.put('/:id', auth, (req, res, next) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    next();
}, uploadFields, async (req, res) => {
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

        // Actualizar enlaces (mezcla de URLs manuales y archivos subidos)
        if (req.body.enlaces !== undefined) {
            let enlacesMeta = [];
            try {
                const parsed = JSON.parse(req.body.enlaces);
                enlacesMeta = Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                enlacesMeta = [];
            }

            const nuevosEnlaces = resolveEnlaces(enlacesMeta, req.files && req.files.adjuntos);

            // Borrar del disco los archivos de enlaces antiguos que ya no están en la lista nueva
            const nuevasUrls = new Set(nuevosEnlaces.map(e => e.url));
            (competicion.enlaces || []).forEach(enlaceAntiguo => {
                if (enlaceAntiguo.origen === 'archivo' && enlaceAntiguo.url && !nuevasUrls.has(enlaceAntiguo.url)) {
                    const oldFilename = enlaceAntiguo.url.split('/').pop();
                    const oldPath = path.join(UPLOAD_DIR, oldFilename);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            });

            competicion.enlaces = nuevosEnlaces;
        }

        // Actualizar disciplina
        competicion.disciplina = req.body.disciplina || null;

        // Manejar la imagen
        const imageFile = req.files && req.files.image && req.files.image[0];
        if (imageFile) {
            if (competicion.imageUrl) {
                const oldFilename = competicion.imageUrl.split('/').pop();
                const oldImagePath = path.join(UPLOAD_DIR, oldFilename);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            // Verificar si la nueva imagen se subió correctamente
            const newFilePath = path.join(UPLOAD_DIR, imageFile.filename);
            if (!fs.existsSync(newFilePath)) {
                return res.status(500).json({ msg: 'Error al guardar la nueva imagen' });
            }

            // Actualizar con la nueva imagen
            competicion.imageUrl = `${BASE_URL}/uploads/competiciones/${imageFile.filename}`;
        }

        await competicion.save();
        res.json(competicion);
    } catch (error) {
        console.error('Error al actualizar competición:', error);
        // Si hay un error, eliminar todos los archivos subidos en esta petición (imagen + adjuntos)
        eliminarArchivosSubidos(req.files);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
});

// Eliminar una competición (ruta protegida)
router.delete('/:id', auth, (req, res, next) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    next();
}, async (req, res) => {
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

        // Eliminar los archivos adjuntos (enlaces de tipo 'archivo')
        (competicion.enlaces || []).forEach(enlace => {
            if (enlace.origen === 'archivo' && enlace.url) {
                const filename = enlace.url.split('/').pop();
                const filePath = path.join(UPLOAD_DIR, filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        });

        await competicion.deleteOne();
        res.status(200).json({ msg: 'Competición eliminada' });
    } catch (err) {
        console.error('Error al eliminar competición:', err);
        res.status(500).json({ msg: 'Error en el servidor', error: err.message });
    }
});

module.exports = router;
