#!/bin/bash
# ============================================================
# PASO 3: Configurar nginx y SSL (ejecutar UNA sola vez)
# Requisito: los registros DNS ya deben apuntar a este servidor
# Ejecutar: bash 3-setup-nginx-ssl.sh
# ============================================================
set -e

# Copiar la configuración de nginx
cp /var/www/cecolivenc/repo/deploy/nginx.conf /etc/nginx/sites-available/cecolivenc

# Activar el sitio
ln -sf /etc/nginx/sites-available/cecolivenc /etc/nginx/sites-enabled/cecolivenc

# Desactivar el sitio por defecto
rm -f /etc/nginx/sites-enabled/default

echo "==> Verificando configuración de nginx..."
nginx -t

echo "==> Reiniciando nginx..."
systemctl restart nginx

echo "==> Obteniendo certificado SSL con Let's Encrypt..."
certbot --nginx -d cecolivenc.es -d www.cecolivenc.es -d api.cecolivenc.es \
  --non-interactive --agree-tos --email admin@cecolivenc.es

echo "==> Recargando nginx con SSL..."
systemctl reload nginx

echo ""
echo "============================================================"
echo "  SSL configurado. Tu sitio está disponible en:"
echo "  https://cecolivenc.es"
echo "  https://api.cecolivenc.es"
echo "============================================================"
