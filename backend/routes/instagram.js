const express = require('express');
const router = express.Router();

// Ruta para obtener posts de Instagram
router.get('/posts', async (req, res) => {
    try {
        // Por ahora devolvemos un array vacío ya que no tenemos la integración con Instagram
        res.json({ data: [] });
    } catch (error) {
        console.error('Error al obtener posts de Instagram:', error);
        res.status(500).json({ message: 'Error al obtener posts de Instagram', error: error.message });
    }
});

module.exports = router; 