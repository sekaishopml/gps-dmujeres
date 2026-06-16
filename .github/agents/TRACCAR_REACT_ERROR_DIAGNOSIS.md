# Diagnóstico: React Error #321 en Traccar Web

## 🔴 Error Reportado
```
Minified React error #321; visit https://react.dev/errors/321 for the full message
```

### Error Completo:
**Invalid hook call. Hooks can only be called inside of the body of a function component.**

---

## 📍 Ubicación del Problema

Los archivos minificados en `/home/Dmujeres-traccar/traccar/` están siendo sobrescritos en el contenedor Traccar v6.2.

**Archivos sospechosos** (contienen hooks React):
- `MapRoutePoints-CUx_dHeJ.js` - ✅ Usa useEffect, useCallback, useId
- `MapPositions-DtWkadAy.js` - ✅ Usa useEffect, useCallback, useRef, useId  
- `MapGeocoder-DZ7GyHA9.js` - ✅ Usa useEffect, useState
- `MainMap-C62m7Ii9.js` - ✅ Usa useEffect
- `useMapStyles-BC2Hb88q.js` - ✅ Usa useMemo

---

## 🔍 Causas Comunes de Error #321

### 1. **Hooks Condicionales**
```javascript
// ❌ INCORRECTO
if (condition) {
  const [state, setState] = useState(null);  // Hook bajo condicional
}

// ✅ CORRECTO
const [state, setState] = useState(null);
if (condition) {
  // usar state aquí
}
```

### 2. **Hooks en Nivel de Módulo**
```javascript
// ❌ INCORRECTO - Hook fuera del componente
const [globalState, setGlobalState] = useState(null);

function MyComponent() {
  return <div>{globalState}</div>;
}

// ✅ CORRECTO - Hook dentro del componente
function MyComponent() {
  const [state, setState] = useState(null);
  return <div>{state}</div>;
}
```

### 3. **Hooks en Callbacks no es Componente**
```javascript
// ❌ INCORRECTO
const handler = () => {
  const [state, setState] = useState(null);  // Hook en función regular
};

// ✅ CORRECTO - Si necesitas persistencia, usar useCallback + useState
const MyComponent = () => {
  const [state, setState] = useState(null);
  const handler = useCallback(() => {
    setState(prev => prev + 1);
  }, []);
  return <button onClick={handler}>Incrementar</button>;
};
```

### 4. **Custom Hooks no Llamados desde Componentes**
```javascript
// ❌ INCORRECTO
function useCustomHook() {
  return useState(null);
}
const result = useCustomHook();  // Llamada fuera de componente

// ✅ CORRECTO
function useCustomHook() {
  return useState(null);
}
function MyComponent() {
  const [state, setState] = useCustomHook();
  return <div>{state}</div>;
}
```

### 5. **Múltiples Copias de React**
```javascript
// Verificar en browser console:
console.log(window.React);  // Debe haber solo UNA instancia
```

---

## 🛠️ Plan de Corrección

### Paso 1: Identificar Cuál Archivo Causa el Error
1. Abrir browser DevTools → Console
2. Ver el stack trace completo del error
3. Identificar qué archivo/componente está fallando

### Paso 2: Obtener Código Fuente
**Opción A:** Si los archivos fueron minificados con source maps:
```bash
# Buscar .map files
find /home/Dmujeres-traccar/traccar -name "*.js.map"
```

**Opción B:** Si no hay source maps, desminificar manualmente:
- Usar https://www.unminify.com/ o herramienta local
- Buscar patrones sospechosos

**Opción C:** Reconstruir desde Traccar upstream:
```bash
# Clonar oficial Traccar
git clone https://github.com/traccar/traccar-web.git
cd traccar-web
npm install
npm run build  # Generará archivos minificados correctos
```

### Paso 3: Validar Reglas de Hooks
Una vez tengas el código fuente o desminificado:
1. Buscar `useState`, `useEffect`, `useCallback`, etc.
2. Verificar que TODOS estén dentro de componentes (funciones que retornan JSX)
3. Verificar que NO estén bajo condicionales
4. Asegurar que el orden sea consistente

### Paso 4: Reempacar Archivos
```bash
# Si usas Vite (como parece por los nombres de hash)
npm run build
# Copiar archivos generados a /home/Dmujeres-traccar/traccar/
```

---

## 🔧 Soluciones Rápidas

### Si el error ocurre en componentes de Mapa:

**Problema típico en MapRoutePoints, MapPositions:**
```javascript
// ❌ COMÚN: useEffect fuera del componente
const updateMap = useEffect(() => {
  // actualizar mapa
}, []);

// ✅ CORRECTO: useEffect DENTRO del componente
function MapComponent() {
  useEffect(() => {
    // actualizar mapa
  }, []);
  return <div id="map" />;
}
```

### Si el error ocurre en MapGeocoder o MapStyles:

**Problema típico: useState no está dentro del render:**
```javascript
// ❌ INCORRECTO
let [searchResults, setSearchResults] = useState([]);  // A nivel módulo

// ✅ CORRECTO
function GeocodePanel() {
  const [searchResults, setSearchResults] = useState([]);
  // ...
}
```

---

## 📋 Checklist de Depuración

- [ ] Abrir DevTools del navegador (F12)
- [ ] Ir a pestaña Console y buscar el stack trace completo
- [ ] Identificar el archivo específico donde ocurre el error
- [ ] Desminificar o conseguir el código fuente
- [ ] Buscar ALL hooks (`useState`, `useEffect`, `useCallback`, `useId`, `useRef`, `useMemo`, `useContext`)
- [ ] Verificar que cada hook esté dentro de una función componente
- [ ] Verificar que NO hay hooks bajo condicionales (if/while/for)
- [ ] Verificar versión de React matchea en package.json vs bundle
- [ ] Recompiler y probar

---

## 🎯 Próximos Pasos

1. **Inmediato**: Abrir navegador en http://localhost:8082 (Traccar)
2. **DevTools Console**: Obtener stack trace completo del error
3. **Identificar archivo**: Cuál .js está fallando
4. **Contactar**: Si fue generado externamente, obtener código fuente
5. **Corregir**: Mover hooks DENTRO de componentes, eliminar condiciones

Si necesitas ayuda profundizando, usa la herramienta **Traccar Web Expert Agent** que ya está configurada.
