const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const InvitacionCodigo = require('../models/InvitacionCodigo');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const { enviarSolicitudCuenta } = require('../services/emailService');

// Solicitud de cuenta (formulario público → email al admin)
router.post(
    '/solicitar-cuenta',
    [
        check('nombre', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'Introduce un correo electrónico válido').isEmail()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await enviarSolicitudCuenta({ nombre: req.body.nombre, email: req.body.email });
            res.json({ msg: 'Solicitud enviada correctamente' });
        } catch (err) {
            console.error('Error al enviar solicitud de cuenta:', err);
            res.status(500).json({ msg: 'Error al enviar la solicitud. Inténtalo de nuevo.' });
        }
    }
);

// Registro de usuario
router.post(
    '/register',
    [
        check('name', 'El nombre es obligatorio').not().isEmpty(),
        check('email', 'Introduce un correo electrónico válido').isEmail(),
        check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
        check('codigoInvitacion', 'El código de invitación es obligatorio').not().isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, fechaNacimiento, numeroLicencia, dni, codigoInvitacion } = req.body;

        // Verificar el código de invitación
        const invitacion = await InvitacionCodigo.findOne({ codigo: codigoInvitacion.toUpperCase(), usado: false });
        if (!invitacion) {
            return res.status(400).json({ msg: 'Código de invitación inválido o ya utilizado' });
        }

        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'El usuario ya existe' });
        }

        // Crear nuevo usuario — userTypes siempre forzado a ['Viewer'] en registro público
        user = new User({
            name,
            email,
            password: await bcrypt.hash(password, 10),
            userTypes: ['Viewer'],
            fechaNacimiento: fechaNacimiento || null,
            numeroLicencia: numeroLicencia || '',
            dni: dni || '',
            activo: true
        });

        await user.save();

        // Invalidar el código de invitación
        invitacion.usado = true;
        invitacion.usadoPor = user._id;
        invitacion.usadoEn = new Date();
        await invitacion.save();

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
            expiresIn: '7d' // Expira en 7 días
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

router.get('/users/:id?', auth, async (req, res) => {
    try {
        // Si se proporciona un ID, cualquier usuario autenticado puede consultar un perfil
        if (req.params.id) {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) {
                return res.status(404).json({ msg: 'Usuario no encontrado' });
            }
            return res.json(user);
        }

        // Listar TODOS los usuarios requiere rol Admin
        if (!req.user.userTypes.includes('Admin')) {
            return res.status(403).json({ msg: 'Acceso denegado: se requiere rol Admin' });
        }

        const users = await User.find().select('-password');
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

        // Validar la nueva contraseña
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
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

// PUT /auth/users/:id — editar usuario (solo Admin)
router.put('/users/:id', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ msg: 'Acceso denegado: se requiere rol Admin' });
    }
    try {
        const { name, email, userTypes, fechaNacimiento, numeroLicencia, dni, telefono, activo } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (userTypes) user.userTypes = userTypes;
        if (fechaNacimiento !== undefined) user.fechaNacimiento = fechaNacimiento || null;
        if (numeroLicencia !== undefined) user.numeroLicencia = numeroLicencia;
        if (dni !== undefined) user.dni = dni;
        if (telefono !== undefined) user.telefono = telefono;
        if (activo !== undefined) user.activo = activo;

        await user.save();
        const updated = await User.findById(req.params.id).select('-password');
        res.json(updated);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
});

// POST /auth/users/:id/reset-password — asignar nueva contraseña (solo Admin)
router.post('/users/:id/reset-password', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ msg: 'Acceso denegado: se requiere rol Admin' });
    }
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ msg: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
});

module.exports = router;
