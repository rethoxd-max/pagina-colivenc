-- Script de creación de base de datos para el sistema de gestión de atletismo

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS atletismo_db;
USE atletismo_db;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    userTypes JSON NOT NULL DEFAULT '["Viewer"]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Posts
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    imageUrl VARCHAR(255),
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Tabla de Atletas
CREATE TABLE IF NOT EXISTS atletas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha_nacimiento INT NOT NULL,
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES users(id),
    UNIQUE KEY unique_atleta (nombre, fecha_nacimiento)
);

-- Tabla de Categorías
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Pruebas
CREATE TABLE IF NOT EXISTS pruebas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de PcAL
CREATE TABLE IF NOT EXISTS pcal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Marcas
CREATE TABLE IF NOT EXISTS marcas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    atleta_id INT NOT NULL,
    prueba_id INT NOT NULL,
    horas INT,
    minutos INT,
    segundos INT,
    metros INT,
    puntos INT,
    lugar VARCHAR(255),
    viento DECIMAL(5,2),
    comentario TEXT,
    categoria_id INT NOT NULL,
    anyo INT NOT NULL,
    pcal_id INT NOT NULL,
    fecha_realizacion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (atleta_id) REFERENCES atletas(id),
    FOREIGN KEY (prueba_id) REFERENCES pruebas(id),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id),
    FOREIGN KEY (pcal_id) REFERENCES pcal(id)
);

-- Tabla de Días de Entrenamiento
CREATE TABLE IF NOT EXISTS dias_entrenamiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Entrenamientos
CREATE TABLE IF NOT EXISTS entrenamientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dia_entrenamiento_id INT NOT NULL,
    tipo ENUM('Técnica', 'Pesas', 'Series', 'Velocidad', 'Vallas', 'Multisaltos', 'Multilanzamientos', 'Rodaje', 'Cuestas', 'Lastre', 'Extras', 'Test') NOT NULL,
    tecnica JSON,
    pesas JSON,
    serie JSON,
    velocidad JSON,
    vallas JSON,
    multisaltos JSON,
    multilanzamientos JSON,
    rodaje JSON,
    cuestas JSON,
    lastre JSON,
    extras JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dia_entrenamiento_id) REFERENCES dias_entrenamiento(id)
);

-- Tabla de Competiciones
CREATE TABLE IF NOT EXISTS competiciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    lugar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Inscripciones
CREATE TABLE IF NOT EXISTS inscripciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_atleta VARCHAR(255) NOT NULL,
    competicion_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competicion_id) REFERENCES competiciones(id),
    FOREIGN KEY (usuario_id) REFERENCES users(id)
);

-- Tabla de Pruebas de Competición
CREATE TABLE IF NOT EXISTS pruebas_competicion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    competicion_id INT NOT NULL,
    prueba_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (competicion_id) REFERENCES competiciones(id),
    FOREIGN KEY (prueba_id) REFERENCES pruebas(id)
);

-- Tabla de Inscripciones a Pruebas
CREATE TABLE IF NOT EXISTS inscripciones_pruebas (
    inscripcion_id INT NOT NULL,
    prueba_competicion_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (inscripcion_id, prueba_competicion_id),
    FOREIGN KEY (inscripcion_id) REFERENCES inscripciones(id),
    FOREIGN KEY (prueba_competicion_id) REFERENCES pruebas_competicion(id)
); 