#!/bin/bash
# Script para resetear Traccar a versión oficial limpia

set -e

echo "🔄 Reseteando Traccar Web a versión oficial..."

TRACCAR_DIR="/home/Dmujeres-traccar/traccar"
BACKUP_DIR="/home/Dmujeres-traccar/traccar-backup-$(date +%s)"

# 1. Hacer backup de archivos personalizados
echo "📦 Creando backup de archivos customizados..."
mkdir -p "$BACKUP_DIR"
cp "$TRACCAR_DIR"/*.js "$BACKUP_DIR/" 2>/dev/null || true
cp "$TRACCAR_DIR"/index.html "$BACKUP_DIR/" 2>/dev/null || true
echo "✅ Backup guardado en: $BACKUP_DIR"

# 2. Eliminar archivos problemáticos (salvo custom.css y xml)
echo "🗑️  Eliminando archivos minificados problemáticos..."
rm -f "$TRACCAR_DIR"/Map*.js
rm -f "$TRACCAR_DIR"/IconButton*.js
rm -f "$TRACCAR_DIR"/Login*.js
rm -f "$TRACCAR_DIR"/Replay*.js
rm -f "$TRACCAR_DIR"/useMap*.js
rm -f "$TRACCAR_DIR"/index.html

# 3. Los archivos se reconstruirán desde la imagen oficial de Traccar
echo "⚙️  Los archivos se reconstruirán desde la imagen oficial en el siguiente restart..."
echo "💡 Para aplicar cambios, ejecutar:"
echo "   docker compose down && docker compose up -d --build"

echo "✅ Limpieza completada"
