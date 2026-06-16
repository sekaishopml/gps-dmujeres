# 🎯 GUÍA PASO A PASO: Corregir React Error #321

## Paso 1: Obtener el Stack Trace Exacto

1. Abre un navegador (Chrome, Firefox, Edge)
2. Ve a: **http://localhost:8082** (puerto Traccar)
3. Abre DevTools: **F12** o **Ctrl+Shift+I**
4. Ve a pestaña: **Console**
5. **Busca el error rojo** con el mensaje de React error #321
6. **Expande el stack trace** haciendo clic en el triángulo
7. **Copia TODO el stack trace**

El stack trace se vería así:
```
Error: Invalid hook call. Hooks can only be called inside of the body of a function component...
    at MapGeocoder.js:...
    at processQueue (scheduler.development.js:...)
    at flushQueue (scheduler.development.js:...)
```

---

## Paso 2: Identificar el Archivo Culpable

El stack trace te mostrará algo como:
- `MapGeocoder-DZ7GyHA9.js` ← ESTE ES EL CULPABLE
- O `MainMap-C62m7Ii9.js`
- O `MapView-Bhqzv-Oc.js`

**Anota el nombre exacto del archivo.**

---

## Paso 3: Desminificar el Archivo

### Opción A: Herramienta Online (Más fácil)

1. Ve a: https://www.unminify.com/
2. Abre el archivo problemático:
   ```bash
   cat /home/Dmujeres-traccar/traccar/<NOMBRE_ARCHIVO>.js
   ```
3. Copia TODO el contenido (Ctrl+A, Ctrl+C)
4. Pega en https://www.unminify.com/
5. Click "Unminify"
6. Guarda el resultado en un editor de texto

### Opción B: Herramienta Local (Línea de comandos)

```bash
npm install -g js-beautify

cat /home/Dmujeres-traccar/traccar/<NOMBRE_ARCHIVO>.js | js-beautify > /tmp/<NOMBRE_ARCHIVO>-unminified.js

cat /tmp/<NOMBRE_ARCHIVO>-unminified.js
```

---

## Paso 4: Buscar el Patrón Incorrecto

Una vez desminificado, busca estos **PATRONES INCORRECTOS**:

### ❌ Patrón 1: Hook bajo condicional
```javascript
if (condition) {
  const [state, setState] = useState(null);  // ❌ ERROR!
}
```

**Solución:**
```javascript
const [state, setState] = useState(null);
if (condition) {
  // usar state aquí
}
```

### ❌ Patrón 2: Hook en bucle
```javascript
for (let i = 0; i < 10; i++) {
  useEffect(() => { /* ... */ }, []);  // ❌ ERROR!
}
```

**Solución:**
```javascript
// Sacar el loop FUERA del componente
const [effects, setEffects] = useState([]);
useEffect(() => {
  const arr = [];
  for (let i = 0; i < 10; i++) {
    arr.push(/* ... */);
  }
  setEffects(arr);
}, []);
```

### ❌ Patrón 3: Hook con && condicional
```javascript
condition && useState(value);  // ❌ ERROR!
```

**Solución:**
```javascript
const [value, setValue] = useState(condition ? initialValue : null);
```

### ❌ Patrón 4: Hook fuera del componente
```javascript
// ❌ A nivel de módulo
const [globalState, setGlobalState] = useState(null);

function MyComponent() {
  return <div>{globalState}</div>;
}
```

**Solución:**
```javascript
function MyComponent() {
  const [state, setState] = useState(null);
  return <div>{state}</div>;
}
```

### ❌ Patrón 5: Hook en función auxiliar
```javascript
function MyComponent() {
  const [state, setState] = useState(null);
  
  // ❌ Hook llamado en función auxiliar
  const helper = () => {
    const [local, setLocal] = useState(null);
  };
}
```

**Solución:**
```javascript
function MyComponent() {
  const [state, setState] = useState(null);
  const [local, setLocal] = useState(null);
  
  const helper = useCallback(() => {
    setState(prev => prev + 1);
  }, []);
}
```

---

## Paso 5: Corregir el Archivo

Una vez identifiques el patrón:

1. **Edita el archivo desminificado**
2. **Aplica la corrección**
3. **Recompila** (si tienes acceso al código fuente)
4. **O** reemplaza en `/home/Dmujeres-traccar/traccar/`

### Si no tienes fuente original:

La forma más rápida es usar la imagen oficial de Traccar sin overrides:

```bash
cd /home/Dmujeres-traccar

# 1. Hacer backup
cp -r traccar traccar-custom-backup

# 2. Eliminar archivos problemáticos
rm traccar/Map*.js traccar/Login*.js traccar/Replay*.js traccar/Icon*.js traccar/useMap*.js traccar/index.html

# 3. Reiniciar Traccar para que use archivos oficiales
docker compose down
docker compose up -d traccar

# 4. Verificar en http://localhost:8082
```

---

## Paso 6: Validar la Corrección

Después de cambios:

```bash
# 1. Reiniciar contenedor
docker compose restart traccar

# 2. Abrir navegador
# http://localhost:8082

# 3. Abrir Console (F12)
# Si NO hay error rojo ✅ RESUELTO!
# Si hay error diferente 🔴 Continuar debugging
```

---

## 🆘 Si Nada Funciona

### Plan B: Reconstruir desde Source

```bash
# 1. Clonar Traccar Web oficial
cd /tmp
git clone https://github.com/traccar/traccar-web.git
cd traccar-web

# 2. Instalar dependencias
npm install

# 3. Revisar package.json para ver versiones de React
cat package.json | grep -A 5 "dependencies"

# 4. Buildear
npm run build

# 5. Copiar archivos dist/ a /home/Dmujeres-traccar/traccar/assets/
cp dist/* /home/Dmujeres-traccar/traccar/

# 6. Reiniciar
docker compose restart traccar
```

---

## 📋 Checklist Final

- [ ] Obtuve el stack trace completo desde DevTools
- [ ] Identifiqué el archivo problemático
- [ ] Desminifiqué el archivo
- [ ] Encontré el patrón incorrecto (hook condicional, a nivel módulo, etc)
- [ ] Corregí el patrón
- [ ] Recompilé o reemplacé archivos
- [ ] Reinicié Traccar
- [ ] Verifiqué que no hay error en Console
- [ ] Funcionan todas las features del mapa

---

## 💡 Tips

1. **Chrome DevTools** es mejor que Firefox para stack traces de React
2. Usa **React DevTools extension** para inspeccionar componentes
3. Si usas VS Code, puedes debuguear con "Debugger for Chrome" extension
4. La mayoría de estos errores se resuelven moviendo hooks al nivel correcto del componente

¡Éxito! 🚀
