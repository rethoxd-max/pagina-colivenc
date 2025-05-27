const mongoose = require('mongoose');
require('dotenv').config();

const Producto = require('../models/Producto');

const actualizarUrlsImagenes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');

        // Actualizar las URLs de las imágenes
        const actualizaciones = [
            {
                nombre: "Camiseta Club Colivenc",
                nuevaUrl: "camiseta-colivenc.png"
            },
            {
                nombre: "Malla de Competición",
                nuevaUrl: "malla-competicion.jpeg"
            },
            {
                nombre: "Sudadera Club Colivenc",
                nuevaUrl: "sudadera-colivenc.jpeg"
            }
        ];

        for (const actualizacion of actualizaciones) {
            const resultado = await Producto.updateOne(
                { nombre: actualizacion.nombre },
                { $set: { imagen: actualizacion.nuevaUrl } }
            );
            console.log(`Actualizado ${actualizacion.nombre}:`, resultado);
        }

        console.log('Actualización completada');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

actualizarUrlsImagenes(); 