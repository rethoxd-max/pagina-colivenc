const fs = require('fs');
const path = require('path');
const https = require('https');

const imagenes = [
    {
        url: 'https://raw.githubusercontent.com/your-repo/colivenc/main/backend/uploads/camiseta-colivenc.jpg',
        nombre: 'camiseta-colivenc.jpg'
    },
    {
        url: 'https://raw.githubusercontent.com/your-repo/colivenc/main/backend/uploads/pantalon-running.jpg',
        nombre: 'pantalon-running.jpg'
    },
    {
        url: 'https://raw.githubusercontent.com/your-repo/colivenc/main/backend/uploads/gorra-colivenc.jpg',
        nombre: 'gorra-colivenc.jpg'
    }
];

const uploadsDir = path.join(__dirname, '../uploads');

// Crear directorio de uploads si no existe
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

async function descargarImagen(url, nombreArchivo) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(uploadsDir, nombreArchivo));
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Imagen descargada: ${nombreArchivo}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(path.join(uploadsDir, nombreArchivo));
            reject(err);
        });
    });
}

async function subirImagenes() {
    try {
        for (const imagen of imagenes) {
            await descargarImagen(imagen.url, imagen.nombre);
        }
        console.log('Todas las imágenes han sido subidas exitosamente');
    } catch (error) {
        console.error('Error al subir las imágenes:', error);
    }
}

subirImagenes(); 