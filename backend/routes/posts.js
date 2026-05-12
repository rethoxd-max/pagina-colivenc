const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Solo se permiten imágenes'));
        }
        cb(null, true);
    }
}).single('image');

// Obtener todos los posts (con paginación opcional)
router.get('/', async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 50);
        const skip  = (page - 1) * limit;

        const posts = await Post.find()
            .populate('author', 'username')
            .populate('disciplina', 'nombre slug color icono')
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
            .sort({ date: -1 })
            .limit(4);

        res.json(posts);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});



// Obtener un post específico por ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', ['name']).populate('disciplina', 'nombre slug color icono');
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
}, upload, async (req, res) => {
    try {
        const { title, content, category, disciplina } = req.body;

        // Validaciones
        if (!title || !content) {
            return res.status(400).json({ msg: 'El título y el contenido son obligatorios.' });
        }

        if (req.file && !require('fs').existsSync(require('path').join(UPLOAD_DIR, req.file.filename))) {
            return res.status(500).json({ msg: 'Error al guardar la imagen' });
        }

        const imageUrl = req.file ? `${BASE_URL}/uploads/posts/${req.file.filename}` : null;

        const post = new Post({
            title,
            content,
            category: category || '',
            disciplina: disciplina || null,
            author: req.user.id,
            imageUrl,
        });

        await post.save();
        res.json(post);
    } catch (error) {
        console.error('Error al crear post:', error);
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


// Editar un post (ruta protegida)
router.put('/:id', auth, (req, res, next) => {
    if (!req.user.userTypes.includes('Admin') && !req.user.userTypes.includes('Editor')) {
        return res.status(403).json({ message: 'Se requiere rol Admin o Editor' });
    }
    next();
}, upload, async (req, res) => {
    try {
        const { title, content, category, disciplina } = req.body;
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

        // Si hay una nueva imagen, eliminar la antigua (si existe) y actualizar
        if (req.file) {
            // Eliminar la imagen anterior si existe
            if (post.imageUrl) {
                const oldFilename = post.imageUrl.split('/').pop();
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

            // Asignar la nueva imagen con la URL absoluta
            post.imageUrl = `${BASE_URL}/uploads/posts/${req.file.filename}`;
        }

        await post.save();
        res.json(post);
    } catch (error) {
        console.error('Error al editar post:', error);
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

        await post.deleteOne();
        res.status(200).json({ msg: 'Post eliminado' });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor', error: err.message });
    }
});

module.exports = router;
