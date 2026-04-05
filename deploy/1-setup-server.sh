#!/bin/bash
# ============================================================
# PASO 1: Configuración inicial del VPS Hetzner (Ubuntu 24.04)
# Ejecutar como root la primera vez: bash 1-setup-server.sh
# ============================================================
set -e

echo "==> Actualizando sistema..."
apt update && apt upgrade -y

echo "==> Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "==> Instalando nginx..."
apt install -y nginx

echo "==> Instalando PM2..."
npm install -g pm2

echo "==> Instalando Certbot (SSL)..."
apt install -y certbot python3-certbot-nginx

echo "==> Instalando git..."
apt install -y git

echo "==> Creando estructura de directorios..."
mkdir -p /var/www/cecolivenc/backend/uploads/posts
mkdir -p /var/www/cecolivenc/backend/uploads/productos
mkdir -p /var/www/cecolivenc/backend/uploads/competiciones
mkdir -p /var/www/cecolivenc/frontend

echo "==> Clonando repositorio..."
# Cambia la URL por la de tu repo
git clone https://github.com/rethoxd-max/pagina-colivenc.git /var/www/cecolivenc/repo

echo "==> Instalando dependencias del backend..."
cd /var/www/cecolivenc/repo/backend
npm install --omit=dev

echo "==> Configurando PM2 para arrancar con el sistema..."
pm2 startup systemd -u root --hp /root

echo ""
echo "============================================================"
echo "  Setup completado."
echo "  Siguiente paso: copiar el archivo .env al servidor y"
echo "  ejecutar: bash 2-deploy.sh"
echo "============================================================"
