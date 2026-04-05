const jwt = require('jsonwebtoken');
const User = require("../models/User");

const auth = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');

        if (!token) {
            return res.status(401).json({ mensaje: 'No hay token, autorización denegada' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar el usuario en la base de datos
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ mensaje: 'Token no válido' });
        }

        // Añadir el usuario a la request
        req.user = user;
        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        
        // Diferenciar entre token expirado y token inválido
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                mensaje: 'Token expirado', 
                code: 'TOKEN_EXPIRED',
                expiredAt: error.expiredAt 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                mensaje: 'Token inválido', 
                code: 'TOKEN_INVALID' 
            });
        }
        
        res.status(401).json({ mensaje: 'Error de autenticación', code: 'AUTH_ERROR' });
    }
};

// Middleware opcional: puebla req.user si hay token válido, pero no bloquea si no lo hay
const optionalAuth = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        req.user = null;
        return next();
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        req.user = user || null;
    } catch (error) {
        req.user = null;
    }
    next();
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
