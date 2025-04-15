const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// En tu archivo .env (en local)
BASE_URL = 'http://localhost:5000'

//BASE_URL=

// Configuración de multer para almacenar imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/posts'); // Carpeta donde se almacenarán las imágenes
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para el archivo
    }
});

const upload = multer({ storage: storage });

// Obtener todos los posts
router.get('/', async (req, res) => {
    const posts = await Post.find().populate('author', ['name']);
    res.json(posts);
});

// Obtener un post específico por ID
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('author', ['name']);
        if (!post) {
            return res.status(404).json({ msg: 'Post no encontrado' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});


// Crear un post con imagen (ruta protegida)
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;

        // Validaciones
        if (!title || !content) {
            return res.status(400).json({ msg: 'El título y el contenido son obligatorios.' });
        }

        const imageUrl = req.file ? `${BASE_URL}/uploads/posts/${req.file.filename}` : null;

        const post = new Post({
            title,
            content,
            author: req.user.id,
            imageUrl,
        });

        await post.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});


// Editar un post (ruta protegida)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post no encontrado' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        // Actualizar los datos del post
        post.title = title;
        post.content = content;

        // Si hay una nueva imagen, eliminar la antigua (si existe) y actualizar
        if (req.file) {
            // Eliminar la imagen anterior si existe
            if (post.imageUrl) {
                const oldImagePath = path.join(__dirname, '..', post.imageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath); // Eliminar el archivo de la imagen anterior
                }
            }

            // Asignar la nueva imagen
            post.imageUrl = req.file ? `${BASE_URL}/uploads/posts/${req.file.filename}` : null;
        }

        await post.save();
        res.json(post);
    } catch (error) {
        console.error(error); // Añadir más detalles de error en el log
        res.status(500).json({ msg: 'Error en el servidor', error });
    }
});

// Eliminar un post (ruta protegida)
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post no encontrado' });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'No autorizado' });
        }

        await post.deleteOne();
        res.status(200).json({ msg: 'Post eliminado' });
    } catch (err) {
        res.status(500).json({ msg: 'Error en el servidor', error: err.message });
    }
});

module.exports = router;
