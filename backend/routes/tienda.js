const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const Producto = require('../models/Producto');
const Orden = require('../models/Orden');
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Verificar la clave de Stripe
const stripeKey = process.env['STRIPE_SECRET_KEY'];
if (!stripeKey) {
    console.error('Error: STRIPE_SECRET_KEY no está configurada en las variables de entorno');
    process.exit(1);
}

// Inicializar Stripe
const stripeInstance = require('stripe')(stripeKey, {
    apiVersion: '2023-10-16',
    typescript: true
});

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/productos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Obtener todos los productos
router.get('/productos', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ mensaje: 'Error al obtener los productos', error: error.message });
    }
});

// Obtener un producto específico
router.get('/productos/id/:id', async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        console.error('Error al obtener el producto:', error);
        res.status(500).json({ mensaje: 'Error al obtener el producto', error: error.message });
    }
});

// Ruta para servir imágenes de productos
router.get('/productos/imagen/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        const imagePath = path.join(__dirname, '../uploads/productos', filename);
        
        // Verificar si el archivo existe
        if (!fs.existsSync(imagePath)) {
            console.error('Archivo no encontrado:', imagePath);
            return res.status(404).json({ mensaje: 'Imagen no encontrada' });
        }

        // Servir el archivo
        res.sendFile(imagePath);
    } catch (error) {
        console.error('Error al servir la imagen:', error);
        res.status(500).json({ mensaje: 'Error al servir la imagen' });
    }
});

// Crear una sesión de Stripe para el pago
router.post('/crear-sesion', auth, async (req, res) => {
    
    const { productoId, talla } = req.body;

    if (!productoId || !talla) {
        return res.status(400).json({ mensaje: "Faltan datos requeridos" });
    }

    try {
        const producto = await Producto.findById(productoId);

        if (!producto) {
            return res.status(404).json({ mensaje: "Producto no encontrado" });
        }

        // Verificar que el usuario existe y tiene un ID válido
        if (!req.user || !req.user._id) {
            return res.status(401).json({ mensaje: "Usuario no autenticado" });
        }

        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "eur",
                        product_data: {
                            name: producto.nombre,
                            images: [producto.imagen],
                        },
                        unit_amount: producto.precio * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${process.env['FRONTEND_URL']}/tienda/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env['FRONTEND_URL']}/tienda/cancel`,
            metadata: {
                productoId: producto._id.toString(),
                talla: talla,
                usuarioId: req.user._id.toString()
            },
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error("Error al crear sesión:", error);
        res.status(500).json({ mensaje: "Error al procesar el pago" });
    }
});

// Crear una sesión de Stripe para el pago del carrito completo
router.post('/crear-sesion-carrito', auth, async (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ mensaje: "El carrito está vacío" });
    }

    try {
        // Verificar que el usuario existe y tiene un ID válido
        if (!req.user || !req.user._id) {
            return res.status(401).json({ mensaje: "Usuario no autenticado" });
        }

        // Obtener los productos del carrito
        const productos = await Promise.all(
            items.map(async (item) => {
                const producto = await Producto.findById(item.productoId);
                if (!producto) {
                    throw new Error(`Producto no encontrado: ${item.productoId}`);
                }
                return {
                    ...item,
                    producto
                };
            })
        );

        // Crear la sesión de Stripe
        const session = await stripeInstance.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: productos.map(item => ({
                price_data: {
                    currency: "eur",
                    product_data: {
                        name: item.producto.nombre,
                        images: [item.producto.imagen],
                    },
                    unit_amount: item.producto.precio * 100,
                },
                quantity: item.cantidad,
            })),
            mode: "payment",
            success_url: `${process.env['FRONTEND_URL']}/tienda/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env['FRONTEND_URL']}/tienda/cancel`,
            metadata: {
                usuarioId: req.user._id.toString(),
                items: JSON.stringify(items)
            },
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error("Error al crear sesión del carrito:", error);
        res.status(500).json({ mensaje: "Error al procesar el pago del carrito" });
    }
});

// Webhook de Stripe para procesar pagos exitosos
router.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            req.body,
            sig,
            process.env['STRIPE_WEBHOOK_SECRET']
        );
    } catch (err) {
        console.error('Error en webhook:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        try {
            // Verificar si es una compra de carrito o de un solo producto
            const items = session.metadata.items ? JSON.parse(session.metadata.items) : null;
            
            if (items) {
                // Es una compra de carrito
                for (const item of items) {
                    const producto = await Producto.findById(item.productoId);
                    if (producto) {
                        producto.stock -= item.cantidad;
                        await producto.save();
                    }
                }
            } else {
                // Es una compra de un solo producto
                const producto = await Producto.findById(session.metadata.productoId);
                if (producto) {
                    producto.stock -= 1;
                    await producto.save();
                }
            }

            // Crear la orden
            const orden = new Orden({
                usuario: session.metadata.usuarioId,
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent,
                estado: 'completada',
                productos: items ? items : [{
                    producto: session.metadata.productoId,
                    cantidad: 1,
                    talla: session.metadata.talla
                }]
            });

            await orden.save();
        } catch (error) {
            console.error('Error al procesar el webhook:', error);
            return res.status(500).json({ error: 'Error al procesar el pago' });
        }
    }

    res.json({ received: true });
});

// Obtener las órdenes de un usuario
router.get('/mis-ordenes', auth, async (req, res) => {
    try {
        const ordenes = await Orden.find({ usuario: req.user._id })
            .populate('productos.producto')
            .sort({ createdAt: -1 });
        res.json(ordenes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener las órdenes', error: error.message });
    }
});

// Crear nuevo producto
router.post('/productos', auth, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'La imagen es requerida' });
    }

    const { nombre, descripcion, precio, categoria, stock, tallas } = req.body;
    
    // Crear producto en Stripe
    const stripeProduct = await stripeInstance.products.create({
      name: nombre,
      description: descripcion,
      images: [`${req.protocol}://${req.get('host')}/tienda/productos/imagen/${req.file.filename}`]
    });

    const stripePrice = await stripeInstance.prices.create({
      product: stripeProduct.id,
      unit_amount: Math.round(precio * 100), // Stripe usa centavos
      currency: 'eur'
    });

    // Crear producto en la base de datos
    const producto = new Producto({
      nombre,
      descripcion,
      precio: parseFloat(precio),
      imagen: req.file.filename,
      categoria,
      stock: parseInt(stock),
      tallas: Array.isArray(tallas) ? tallas : tallas.split(',').map(t => t.trim()),
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id
    });

    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ mensaje: 'Error al crear el producto', error: error.message });
  }
});

// Actualizar un producto
router.put('/productos/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, tallas } = req.body;
    const productoId = req.params.id;

    // Verificar si el producto existe
    const productoExistente = await Producto.findById(productoId);
    if (!productoExistente) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Preparar los datos de actualización
    const datosActualizacion = {
      nombre,
      descripcion,
      precio,
      tallas: Array.isArray(tallas) ? tallas : JSON.parse(tallas)
    };

    // Si se subió una nueva imagen, actualizar la ruta
    if (req.file) {
      // Eliminar la imagen anterior si existe
      if (productoExistente.imagen) {
        const rutaImagenAnterior = path.join(__dirname, '../uploads/productos', productoExistente.imagen);
        if (fs.existsSync(rutaImagenAnterior)) {
          fs.unlinkSync(rutaImagenAnterior);
        }
      }
      datosActualizacion.imagen = req.file.filename;
    }

    // Actualizar el producto
    const productoActualizado = await Producto.findByIdAndUpdate(
      productoId,
      datosActualizacion,
      { new: true }
    );

    res.json(productoActualizado);
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el producto' });
  }
});

// Eliminar un producto
router.delete('/productos/:id', auth, async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        // Eliminar el producto de Stripe
        if (producto.stripeProductId) {
            try {
                await stripeInstance.products.del(producto.stripeProductId);
            } catch (stripeError) {
                console.error('Error al eliminar producto de Stripe:', stripeError);
            }
        }

        // Eliminar la imagen del producto
        if (producto.imagen) {
            const imagePath = path.join(__dirname, '../uploads/productos', producto.imagen);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Eliminar el producto de la base de datos
        await Producto.findByIdAndDelete(req.params.id);

        res.json({ mensaje: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar el producto:', error);
        res.status(500).json({ mensaje: 'Error al eliminar el producto', error: error.message });
    }
});

module.exports = router; 