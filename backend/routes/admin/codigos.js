const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const auth = require('../../middleware/auth');
const InvitacionCodigo = require('../../models/InvitacionCodigo');

// Solo Admin puede acceder a estas rutas

// GET /admin/codigos — listar todos los códigos
router.get('/', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ msg: 'Acceso denegado' });
    }
    try {
        const codigos = await InvitacionCodigo.find()
            .populate('creadoPor', 'name email')
            .populate('usadoPor', 'name email')
            .sort({ creadoEn: -1 });
        res.json(codigos);
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
});

// POST /admin/codigos — generar nuevo código de invitación
router.post('/', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ msg: 'Acceso denegado' });
    }
    try {
        const codigo = crypto.randomBytes(6).toString('hex').toUpperCase();
        const invitacion = new InvitacionCodigo({
            codigo,
            creadoPor: req.user.id
        });
        await invitacion.save();
        res.json(invitacion);
    } catch (error) {
        res.status(500).json({ msg: 'Error al generar el código' });
    }
});

// DELETE /admin/codigos/:id — eliminar código no usado
router.delete('/:id', auth, async (req, res) => {
    if (!req.user.userTypes.includes('Admin')) {
        return res.status(403).json({ msg: 'Acceso denegado' });
    }
    try {
        const codigo = await InvitacionCodigo.findById(req.params.id);
        if (!codigo) {
            return res.status(404).json({ msg: 'Código no encontrado' });
        }
        if (codigo.usado) {
            return res.status(400).json({ msg: 'No se puede eliminar un código ya usado' });
        }
        await InvitacionCodigo.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Código eliminado' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar el código' });
    }
});

module.exports = router;
