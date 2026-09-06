const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { sincronizarVinculoDesdeNoticia } = require('../utils/vinculoNoticiaCompeticion');

const COMPETICION_POPULATE = 'nombre fecha lugar imageUrl';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'posts');

// Asegurarse de que el directorio existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`Directorio creado: ${UPLOAD_DIR}`);
}

// Configuración de multer para almacenar imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
        const filename = Date.now() + path.extname(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB, para soportar documentos adjuntos de cualquier tipo
    },
    fileFilter: function (req, file, cb) {
        // La imagen principal debe seguir siendo una imagen o un PDF (se usa como portada/preview)
        if (file.fieldname === 'image' && !file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
            return cb(new Error('La imagen principal debe ser una imagen o un PDF'));
        }
        cb(null, true);
    }
});

// Acepta la imagen principal y hasta 10 archivos adjuntos (para los "enlaces" de tipo archivo)
const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'adjuntos', maxCount: 10 }
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
                    url: `uploads/posts/${file.filename}`,
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

// Obtener todos los posts (con paginación opcional)
router.get('/', async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const skip  = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'username')
            .populate('disciplina', 'nombre slug color icono')
            .populate('competicion', COMPETICION_POPULATE)
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        res.json(posts);
    } catch (error) {
        console.error('Error al obtener posts:', error);
        res.status(500).json({ message: 'Error al obtener los posts' });
    }
});

// Obtener los últimos posts (ordenados por fecha descendente)
router.get('/ultimos', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', ['name'])
            .populate('disciplina', 'nombre slug color icono')
            .populate('competicion', COMPETICION_POPULATE)
            .sort({ date: -1 })
            .limit(4);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});



// Obtener las noticias destacadas (pública) — hasta 2, se muestran en el Home
router.get('/destacado', async (req, res) => {
    try {
        const posts = await Post.find({ destacado: true })
            .populate('author', ['name'])
            .populate('disciplina', 'nombre slug color icono')
            .populate('competicion', COMPETICION_POPULATE)
            .sort({ date: -1 })
            .limit(2);
        res.json(posts); // array vacío si no hay ninguna destacada
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});

// Obtener un post específico por ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', ['name'])
            .populate('disciplina', 'nombre slug color icono')
            .populate('competicion', COMPETICION_POPULATE);
        if (!post) {
            return res.status(404).json({ msg: 'Post no encontrado' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});


// Crear un post con imagen (ruta protegida)
router.post('/', auth, (req, res, next) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    next();
}, uploadFields, async (req, res) => {
    try {
        const { title, content, category, disciplina, competicionVinculada } = req.body;

        // Validaciones
        if (!title || !content) {
            return res.status(400).json({ msg: 'El título y el contenido son obligatorios.' });
        }

        const imageFile = req.files && req.files.image && req.files.image[0];

        if (imageFile && !fs.existsSync(path.join(UPLOAD_DIR, imageFile.filename))) {
            return res.status(500).json({ msg: 'Error al guardar la imagen' });
        }

        const imageUrl = imageFile ? `uploads/posts/${imageFile.filename}` : null;

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

        const post = new Post({
            title,
            content,
            category: category || '',
            disciplina: disciplina || null,
            author: req.user.id,
            imageUrl,
            enlaces,
        });

        if (competicionVinculada && mongoose.Types.ObjectId.isValid(competicionVinculada)) {
            await sincronizarVinculoDesdeNoticia(post, competicionVinculada);
        }

        await post.save();
        await post.populate('competicion', COMPETICION_POPULATE);
        res.json(post);
    } catch (error) {
        console.error('Error al crear post:', error);
        // Si hay un error, eliminar todos los archivos subidos en esta petición (imagen + adjuntos)
        eliminarArchivosSubidos(req.files);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
});


// Editar un post (ruta protegida)
router.put('/:id', auth, (req, res, next) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    next();
}, uploadFields, async (req, res) => {
    try {
        const { title, content, category, disciplina, competicionVinculada } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post no encontrado' });
        }

        // Verificamos si es el autor, a menos que sea Admin o Editor
        if (post.author.toString() !== req.user.id && !req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
            return res.status(401).json({ msg: 'No autorizado para editar este post' });
        }

        // Actualizar los datos del post
        post.title = title;
        post.content = content;
        post.category = category || '';
        post.disciplina = disciplina || null;

        // Actualizar el vínculo con una competición (cadena vacía = quitar el vínculo)
        if (competicionVinculada !== undefined) {
            const idLimpio = competicionVinculada && mongoose.Types.ObjectId.isValid(competicionVinculada)
                ? competicionVinculada
                : null;
            await sincronizarVinculoDesdeNoticia(post, idLimpio);
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
            (post.enlaces || []).forEach(enlaceAntiguo => {
                if (enlaceAntiguo.origen === 'archivo' && enlaceAntiguo.url && !nuevasUrls.has(enlaceAntiguo.url)) {
                    const oldFilename = enlaceAntiguo.url.split('/').pop();
                    const oldPath = path.join(UPLOAD_DIR, oldFilename);
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
                }
            });

            post.enlaces = nuevosEnlaces;
        }

        // Si hay una nueva imagen, eliminar la antigua (si existe) y actualizar
        const imageFile = req.files && req.files.image && req.files.image[0];
        if (imageFile) {
            // Eliminar la imagen anterior si existe
            if (post.imageUrl) {
                const oldFilename = post.imageUrl.split('/').pop();
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

            // Asignar la nueva imagen
            post.imageUrl = `uploads/posts/${imageFile.filename}`;
        }

        await post.save();
        await post.populate('competicion', COMPETICION_POPULATE);
        res.json(post);
    } catch (error) {
        console.error('Error al editar post:', error);
        // Si hay un error, eliminar todos los archivos subidos en esta petición (imagen + adjuntos)
        eliminarArchivosSubidos(req.files);
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
});

// Marcar/desmarcar un post como destacado (solo Admin/Editor) — máximo 2 a la vez
router.patch('/:id/destacar', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post no encontrado' });

        const nuevoEstado = !post.destacado;
        if (nuevoEstado) {
            const totalDestacados = await Post.countDocuments({ destacado: true });
            if (totalDestacados >= 2) {
                return res.status(400).json({ msg: 'Ya hay 2 noticias destacadas. Quita una antes de destacar otra.' });
            }
        }
        post.destacado = nuevoEstado;
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error: error.message });
    }
});

// Eliminar un post (ruta protegida)
router.delete('/:id', auth, (req, res, next) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    next();
}, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post no encontrado' });
        }

        // Verificamos si es el autor, a menos que sea Admin o Editor
        if (post.author.toString() !== req.user.id && !req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
            return res.status(401).json({ msg: 'No autorizado para eliminar este post' });
        }

        // Borrar imagen del disco si existe
        if (post.imageUrl) {
            const filename = post.imageUrl.split('/').pop();
            const filePath = path.join(UPLOAD_DIR, filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        // Eliminar los archivos adjuntos (enlaces de tipo 'archivo')
        (post.enlaces || []).forEach(enlace => {
            if (enlace.origen === 'archivo' && enlace.url) {
                const filename = enlace.url.split('/').pop();
                const filePath = path.join(UPLOAD_DIR, filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        });

        // Desenlazar la competición asociada, si la tenía
        if (post.competicion) {
            await sincronizarVinculoDesdeNoticia(post, null);
        }

        await post.deleteOne();
        res.status(200).json({ msg: 'Post eliminado' });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor', error: err.message });
    }
});

module.exports = router;
