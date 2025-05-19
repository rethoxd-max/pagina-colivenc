const jwt = require('jsonwebtoken');
const User = require("../models/User");

const auth = async (req, res, next) => {
    console.log('=== Middleware de Autenticación ===');
    console.log('Headers recibidos:', req.headers);
    
    try {
        const token = req.header('x-auth-token');
        console.log('Token recibido:', !!token);

        if (!token) {
            console.log('No se encontró token en los headers');
            return res.status(401).json({ mensaje: 'No hay token, autorización denegada' });
        }

        console.log('Intentando verificar token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);

        // Buscar el usuario en la base de datos
        const user = await User.findById(decoded.id).select('-password');
        console.log('Usuario encontrado en BD:', !!user);

        if (!user) {
            console.log('Usuario no encontrado en la base de datos');
            return res.status(401).json({ mensaje: 'Token no válido' });
        }

        // Añadir el usuario completo a la request
        req.user = user;
        console.log('Usuario añadido a la request:', {
            id: user._id,
            email: user.email,
            rol: user.rol
        });

        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        res.status(401).json({ mensaje: 'Token no válido' });
    }
};

module.exports = auth;
