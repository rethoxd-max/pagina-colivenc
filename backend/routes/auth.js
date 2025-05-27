const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { check, validationResult } = require('express-validator'); // Importar express-validator
const router = express.Router();
const auth = require('../middleware/auth');

// Registro de usuario
router.post(
    '/register',
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'Introduce un correo electrónico válido').isEmail(),
        check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
        check('userTypes', 'Los tipos de usuario deben ser válidos').optional().isArray()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, userTypes } = req.body;

        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Crear nuevo usuario
        user = new User({
            name,
            email,
            password: await bcrypt.hash(password, 10), // Encriptar la contraseña
            userTypes: userTypes || ['Viewer'] // Asignar 'viewer' si no se proporcionan tipos
        });

        await user.save();
        res.json({ msg: 'Usuario registrado con éxito' });
    }
);

// Login de usuario
router.post(
    '/login',
    [
        check('email', 'Introduce un correo electrónico válido').isEmail(),
        check('password', 'La contraseña es obligatoria').not().isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Verificar si el usuario existe
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Usuario no encontrado' });
        }

        // Verificar la contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Contraseña incorrecta' });
        }

        // Crear token JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: 3600 // Expira en 1 hora
        });

        // Incluir los tipos de usuario en la respuesta
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                userTypes: user.userTypes
            }
        });
    }
);

router.get('/users/:id?', async (req, res) => {
    try {
        // Si se proporciona un ID, obtener un usuario específico
        if (req.params.id) {
            const user = await User.findById(req.params.id).select('-password'); // No devolver la contraseña
            if (!user) {
                return res.status(404).json({ msg: 'Usuario no encontrado' });
            }
            return res.json(user);
        }

        // Si no se proporciona ID, obtener todos los usuarios
        const users = await User.find().select('-password'); // No devolver las contraseñas
        res.json(users);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
});

// Cambiar contraseña
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar la contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
        }

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error al cambiar la contraseña:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router;
