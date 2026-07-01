#!/bin/bash
# ============================================================
# PASO 2: Desplegar/actualizar la aplicación en el VPS
# Ejecutar en el servidor: bash 2-deploy.sh
# ============================================================
set -e

REPO_DIR="/var/www/cecolivenc/repo"
FRONTEND_DIR="/var/www/cecolivenc/frontend"

echo "==> Actualizando código desde GitHub (rama main)..."
cd $REPO_DIR
git fetch origin
git checkout main
# --ff-only: si el repo del servidor tiene cambios locales o archivos sin trackear que
# chocan con lo que viene de GitHub, esto falla en seco (gracias a "set -e" de arriba)
# en vez de intentar fusionar o quedarse esperando un editor interactivo por SSH.
git pull --ff-only origin main

echo "==> Actualizando dependencias del backend..."
cd $REPO_DIR/backend
npm install --omit=dev

echo "==> Copiando build del frontend..."
# El build de Angular se sube por separado con: scp -r dist/browser/* root@IP:/var/www/cecolivenc/frontend/
# (ver instrucciones en README-deploy.md)

echo "==> Reiniciando backend con PM2..."
cd $REPO_DIR/backend
pm2 restart cecolivenc-backend 2>/dev/null || pm2 start ecosystem.config.js

pm2 save

echo ""
echo "============================================================"
echo "  Deploy completado. Backend corriendo en puerto 3000."
echo "  Comprueba el estado con: pm2 status"
echo "============================================================"
