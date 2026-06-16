#!/usr/bin/env bash
# Script para analizar archivos minificados y detectar patrones de Error #321

set -e

TRACCAR_DIR="/home/Dmujeres-traccar/traccar"
REPORT_FILE="/tmp/react-error-321-analysis.txt"

echo "🔍 Analizando archivos Traccar para patrones de Error #321..." > "$REPORT_FILE"
echo "Fecha: $(date)" >> "$REPORT_FILE"
echo "======================================================" >> "$REPORT_FILE"

# Archivos que contienen hooks React
HOOK_FILES=(
    "MapRoutePoints-CUx_dHeJ.js"
    "MapPositions-DtWkadAy.js"
    "MapGeocoder-DZ7GyHA9.js"
    "MainMap-C62m7Ii9.js"
    "useMapStyles-BC2Hb88q.js"
    "MapView-Bhqzv-Oc.js"
    "MapRoutePath-DaJlD9QK.js"
    "IconButton-oialqkv3.js"
    "LoginPage-DbAu7k9c.js"
    "ReplayPage-CLJEvY0U.js"
)

echo "" >> "$REPORT_FILE"
echo "📋 ARCHIVOS CON HOOKS DETECTADOS:" >> "$REPORT_FILE"
echo "======================================================" >> "$REPORT_FILE"

for file in "${HOOK_FILES[@]}"; do
    filepath="$TRACCAR_DIR/$file"
    
    if [[ -f "$filepath" ]]; then
        echo "" >> "$REPORT_FILE"
        echo "📄 Archivo: $file" >> "$REPORT_FILE"
        echo "   Tamaño: $(wc -c < "$filepath") bytes" >> "$REPORT_FILE"
        
        # Contar ocurrencias de hooks
        if grep -q "useEffect" "$filepath"; then
            count=$(grep -o "useEffect" "$filepath" | wc -l)
            echo "   ✓ useEffect: $count ocurrencias" >> "$REPORT_FILE"
        fi
        
        if grep -q "useState" "$filepath"; then
            count=$(grep -o "useState" "$filepath" | wc -l)
            echo "   ✓ useState: $count ocurrencias" >> "$REPORT_FILE"
        fi
        
        if grep -q "useCallback" "$filepath"; then
            count=$(grep -o "useCallback" "$filepath" | wc -l)
            echo "   ✓ useCallback: $count ocurrencias" >> "$REPORT_FILE"
        fi
        
        if grep -q "useRef" "$filepath"; then
            count=$(grep -o "useRef" "$filepath" | wc -l)
            echo "   ✓ useRef: $count ocurrencias" >> "$REPORT_FILE"
        fi
        
        if grep -q "useId" "$filepath"; then
            count=$(grep -o "useId" "$filepath" | wc -l)
            echo "   ✓ useId: $count ocurrencias" >> "$REPORT_FILE"
        fi
        
        if grep -q "useMemo" "$filepath"; then
            count=$(grep -o "useMemo" "$filepath" | wc -l)
            echo "   ✓ useMemo: $count ocurrencias" >> "$REPORT_FILE"
        fi
    else
        echo "❌ No encontrado: $file" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"
echo "🔴 PATRONES SOSPECHOSOS (Si existen):" >> "$REPORT_FILE"
echo "======================================================" >> "$REPORT_FILE"

# Buscar patrones sospechosos en todos los JS
echo "" >> "$REPORT_FILE"
echo "📍 Buscando patrones de condicionales alrededor de hooks..." >> "$REPORT_FILE"

for file in "$TRACCAR_DIR"/*.js; do
    filename=$(basename "$file")
    
    # Buscar patterns sospechosos (simplificado para minificado)
    if grep -E "(if|for|while|&&|\|\|).*use[A-Z]" "$file" > /dev/null 2>&1; then
        echo "⚠️  $filename contiene posibles hooks condicionales" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"
echo "======================================================" >> "$REPORT_FILE"
echo "📝 RECOMENDACIONES:" >> "$REPORT_FILE"
echo "======================================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "1. Abrir DevTools (F12) en http://localhost:8082" >> "$REPORT_FILE"
echo "2. Ir a Console y buscar el STACK TRACE completo del error" >> "$REPORT_FILE"
echo "3. El stack trace te dirá cuál archivo .js está fallando" >> "$REPORT_FILE"
echo "4. Una vez identifiques el archivo, podemos desminificarlo y corregirlo" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Para desminificar manualmente:" >> "$REPORT_FILE"
echo "  - Copiar el contenido del .js" >> "$REPORT_FILE"
echo "  - Ir a https://www.unminify.com/" >> "$REPORT_FILE"
echo "  - Pegar y desminificar" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

cat "$REPORT_FILE"
