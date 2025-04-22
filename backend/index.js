const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar las variables de entorno
dotenv.config();

// Inicializar la aplicación de Express
const app = express();
const path = require('path');

app.use(bodyParser.json());

// Configura CORS
app.use(cors({
    origin: 'http://localhost:4200',  // Permitir las solicitudes desde Angular
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Conectado a MongoDB');
}).catch((err) => {
    console.log('Error al conectar a MongoDB:', err);
});

// Puerto
const PORT = process.env.PORT || 5000;

// Ruta para servir las imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Otras configuraciones de middlewares
app.use(express.json());

// Rutas
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

const atletaRoutes = require('./routes/ranking/atletas');
const pruebaRoutes = require('./routes/ranking/pruebas');
const marcaRoutes = require('./routes/ranking/marcas');
const rankingRoutes = require('./routes/ranking');
const sectorRoutes = require('./routes/ranking/sectores');
const categoriaRoutes = require('./routes/ranking/categorias');
const PcALRoutes = require('./routes/ranking/pcAl');
const competicionesRoutes = require('./routes/calendario/competiciones');
const pruebaCompeticionRoutes = require('./routes/calendario/competiciones/pruebasCompeticiones');
const categoriaCompeticionRoutes = require('./routes/calendario/competiciones/categoriasCompeticiones');
const sectorCompeticionRoutes = require('./routes/calendario/competiciones/sectoresCompeticiones');
const inscripcionesRoutes = require('./routes/calendario/inscripciones');
const perfilAtletaRoutes = require('./routes/perfil-atleta');

// Rutas de entrenamiento
const calendarioEntrenamientoRoutes = require('./routes/entrenamientos/calendariosEntrenamiento');
const diasEntrenamientoRoutes = require('./routes/entrenamientos/diasEntrenamiento');
const entrenamientosRoutes = require('./routes/entrenamientos/entrenamientos');
const gruposEntrenamientoRoutes = require('./routes/entrenamientos/gruposEntrenamiento');

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);

app.use('/atletas', atletaRoutes);
app.use('/pruebas', pruebaRoutes);
app.use('/marcas', marcaRoutes);
app.use('/ranking', rankingRoutes);
app.use('/sectores', sectorRoutes);
app.use('/categorias', categoriaRoutes);
app.use('/PcAL', PcALRoutes);
app.use('/competiciones', competicionesRoutes);
app.use('/pruebasCompeticion', pruebaCompeticionRoutes);
app.use('/categoriasCompeticion', categoriaCompeticionRoutes);
app.use('/sectoresCompeticion', sectorCompeticionRoutes);
app.use('/inscripciones', inscripcionesRoutes);
app.use('/perfil-atleta', perfilAtletaRoutes);

// Rutas de entrenamiento
app.use('/calendarios-entrenamiento', calendarioEntrenamientoRoutes);
app.use('/dias-entrenamiento', diasEntrenamientoRoutes);
app.use('/entrenamientos', entrenamientosRoutes);
app.use('/grupos-entrenamiento', gruposEntrenamientoRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});