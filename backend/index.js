// Cargar variables de entorno primero
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Verificar variables críticas
const requiredEnvVars = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'FRONTEND_URL'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Error: Faltan las siguientes variables de entorno:', missingEnvVars.join(', '));
    process.exit(1);
}

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const instagramRoutes = require('./routes/instagram');
const tiendaRoutes = require('./routes/tienda');

// Verificar variables de entorno críticas
console.log('Verificando variables de entorno...');
console.log('PORT:', process.env.PORT);

// Inicializar la aplicación de Express
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: ['https://cecolivenc.es', 'https://api.cecolivenc.es', 'http://localhost:4200'],
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

// Configuración de límites para subida de archivos
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Ruta para servir las imágenes
app.use("/uploads", express.static(path.join("/var/www/colivenc/backend/uploads")));

// Otras configuraciones
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log('=== Request Recibida ===');
  console.log('Método:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
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
const inscripcionesRoutes = require("./routes/calendario/inscripciones");
const perfilAtletaRoutes = require("./routes/perfil-atleta");

// Rutas de entrenamiento
const calendarioEntrenamientoRoutes = require("./routes/entrenamientos/calendariosEntrenamiento");
const diasEntrenamientoRoutes = require("./routes/entrenamientos/diasEntrenamiento");
const entrenamientosRoutes = require("./routes/entrenamientos/entrenamientos");
const gruposEntrenamientoRoutes = require("./routes/entrenamientos/gruposEntrenamiento");

// Rutas de Instagram
app.use('/instagram', instagramRoutes);

// Rutas de la tienda
// Ruta especial para el webhook de Stripe (debe estar antes de las otras rutas)
app.post('/tienda/webhook', express.raw({ type: 'application/json' }), tiendaRoutes);

// Rutas normales de la tienda
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
app.use("/perfil-atleta", perfilAtletaRoutes);
app.use("/calendarios-entrenamiento", calendarioEntrenamientoRoutes);
app.use("/dias-entrenamiento", diasEntrenamientoRoutes);
app.use("/entrenamientos", entrenamientosRoutes);
app.use("/grupos-entrenamiento", gruposEntrenamientoRoutes);

// Conectar a MongoDB
mongoose
  .connect("mongodb://127.0.0.1:27017/colivenc")
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.log("Error al conectar a MongoDB:", err));

// Iniciar el servidor
const PORT = process.env["PORT"] || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
