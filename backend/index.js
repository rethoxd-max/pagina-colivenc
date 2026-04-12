// Cargar variables de entorno primero
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Verificar variables críticas (en desarrollo Stripe es opcional)
const isProduction = process.env.NODE_ENV === 'production';
const requiredEnvVars = isProduction 
    ? ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'FRONTEND_URL', 'JWT_SECRET', 'MONGODB_URI', 'BASE_URL']
    : ['FRONTEND_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Error: Faltan las siguientes variables de entorno:', missingEnvVars.join(', '));
    process.exit(1);
}

// Advertencia si faltan variables de Stripe en desarrollo
if (!isProduction && (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET)) {
    console.warn('⚠️  Advertencia: Las funciones de Stripe no estarán disponibles sin configurar STRIPE_SECRET_KEY y STRIPE_WEBHOOK_SECRET');
}

// Crear directorios de uploads si no existen
const uploadsDir = path.join(__dirname, 'uploads');
const postsDir = path.join(__dirname, 'uploads', 'posts');
const competicionesDir = path.join(__dirname, 'uploads', 'competiciones');
const instagramDir = path.join(__dirname, 'uploads', 'instagram');

[uploadsDir, postsDir, competicionesDir, instagramDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Directorio creado: ${dir}`);
    }
});

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const instagramRoutes = require('./routes/instagram');
const tiendaRoutes = require('./routes/tienda');

if (!isProduction) {
    console.log('Verificando variables de entorno...');
    console.log('PORT:', process.env.PORT);
}

// Inicializar la aplicación de Express
const app = express();

// Cabeceras de seguridad HTTP (helmet)
app.use(helmet({
    contentSecurityPolicy: false // Se activará cuando se configure el CSP completo
}));

// Configuración de CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://cecolivenc.es', 'https://www.cecolivenc.es']
  : ['http://localhost:4200', 'http://127.0.0.1:4200', process.env.FRONTEND_URL];

const corsOptions = {
  origin: allowedOrigins.filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  exposedHeaders: ['Content-Type', 'x-auth-token'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Aplicar CORS globalmente
app.use(cors(corsOptions));

// Middleware para manejar preflight requests
app.options('*', cors(corsOptions));

// Webhook de Stripe ANTES del bodyParser (necesita el body crudo sin parsear)
app.post('/tienda/webhook', express.raw({ type: 'application/json' }), tiendaRoutes);

// Configuración de límites para peticiones
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

// Middleware para logging de requests (solo en desarrollo)
if (!isProduction) {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// Configuración de archivos estáticos
// no-cache + ETag: el navegador siempre pregunta al servidor si el archivo cambió.
// Si no cambió -> 304 Not Modified (rápido, sin descarga). Si cambió -> descarga la nueva versión.
// Esto garantiza que imágenes actualizadas (posts, productos, competiciones) se muestren
// siempre al instante sin necesidad de forzar recarga en el navegador.
const staticOptions = {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
        res.set('Cache-Control', 'no-cache, must-revalidate');
    }
};

// Ruta única para archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), staticOptions));

// Middleware para manejar errores 404 en archivos estáticos
app.use('/uploads', (req, res, next) => {
    if (req.path.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, req.path);
        if (!fs.existsSync(filePath)) {
            console.log('Archivo no encontrado:', filePath);
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
    }
    next();
});

// Rutas
const authRoutes = require("./routes/auth");
const postRoutes = require("./routes/posts");
const atletaRoutes = require("./routes/ranking/atletas");
const pruebaRoutes = require("./routes/ranking/pruebas");
const marcaRoutes = require("./routes/ranking/marcas");
const rankingRoutes = require("./routes/ranking");
const sectorRoutes = require("./routes/ranking/sectores");
const categoriaRoutes = require("./routes/ranking/categorias");
const PcALRoutes = require("./routes/ranking/pcAl");
const competicionesRoutes = require("./routes/calendario/competiciones");
const pruebaCompeticionRoutes = require("./routes/calendario/competiciones/pruebasCompeticiones");
const categoriaCompeticionRoutes = require("./routes/calendario/competiciones/categoriasCompeticiones");
const sectorCompeticionRoutes = require("./routes/calendario/competiciones/sectoresCompeticiones");
const inscripcionesRoutes = require("./routes/calendario/inscripciones");const inscripcionesPublicasRoutes = require('./routes/calendario/inscripciones-publicas');const perfilAtletaRoutes = require("./routes/perfil-atleta");

// Rutas de entrenamiento
const calendarioEntrenamientoRoutes = require("./routes/entrenamientos/calendariosEntrenamiento");
const diasEntrenamientoRoutes = require("./routes/entrenamientos/diasEntrenamiento");
const entrenamientosRoutes = require("./routes/entrenamientos/entrenamientos");
const gruposEntrenamientoRoutes = require("./routes/entrenamientos/gruposEntrenamiento");

// Rate limiting: máximo 10 intentos de login/registro cada 15 minutos por IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { mensaje: 'Demasiados intentos. Inténtalo de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

// Rutas de Instagram
app.use('/instagram', instagramRoutes);

// Rutas de la tienda
app.use("/tienda", tiendaRoutes);

// Montar rutas
app.use("/auth", authRoutes);
app.use("/posts", postRoutes);
app.use("/atletas", atletaRoutes);
app.use("/pruebas", pruebaRoutes);
app.use("/marcas", marcaRoutes);
app.use("/ranking", rankingRoutes);
app.use("/sectores", sectorRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/PcAL", PcALRoutes);
app.use("/competiciones", competicionesRoutes);
app.use("/pruebasCompeticion", pruebaCompeticionRoutes);
app.use("/categoriasCompeticion", categoriaCompeticionRoutes);
app.use("/sectoresCompeticion", sectorCompeticionRoutes);
app.use("/inscripciones", inscripcionesRoutes);
app.use("/inscripciones-publicas", inscripcionesPublicasRoutes);
app.use("/perfil-atleta", perfilAtletaRoutes);
app.use("/calendarios-entrenamiento", calendarioEntrenamientoRoutes);
app.use("/dias-entrenamiento", diasEntrenamientoRoutes);
app.use("/entrenamientos", entrenamientosRoutes);
app.use("/grupos-entrenamiento", gruposEntrenamientoRoutes);

// Rutas de administración
const codigosAdminRoutes = require('./routes/admin/codigos');
app.use('/admin/codigos', codigosAdminRoutes);

// Disciplinas
const disciplinasRoutes = require('./routes/disciplinas');
app.use('/disciplinas', disciplinasRoutes);

// Conectar a MongoDB
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/colivenc";
mongoose
  .connect(mongoUri)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.log("Error al conectar a MongoDB:", err));

// Manejador de errores global — evita exponer stack traces al cliente
app.use((err, req, res, next) => {
    if (!isProduction) {
        console.error(err.stack);
    } else {
        console.error(`Error: ${err.message}`);
    }
    res.status(err.status || 500).json({ mensaje: 'Error interno del servidor' });
});

// Iniciar el servidor
const PORT = process.env["PORT"] || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
