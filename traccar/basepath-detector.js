/* Basepath Auto-Detection Script for Traccar */
(function() {
  // Detectar el basepath basado en la ubicación actual
  const pathname = window.location.pathname;
  let detectedBasepath = '/';
  
  // Si la URL contiene /dmujeres-traccar/, usar eso como basepath
  if (pathname.includes('/dmujeres-traccar/')) {
    detectedBasepath = '/dmujeres-traccar/';
  } else if (pathname.includes('/admin/')) {
    detectedBasepath = '/admin/';
  } else if (pathname.includes('/dmujeres-gps/')) {
    detectedBasepath = '/dmujeres-gps/';
  }
  
  // Guardar en el window para que otros scripts lo usen
  window.__TRACCAR_BASEPATH__ = detectedBasepath;
  
  // Inyectar en el sessionStorage como backup
  try {
    sessionStorage.setItem('traccar_basepath', detectedBasepath);
  } catch (e) {
    // Silencioso si sessionStorage no está disponible
  }
})();
