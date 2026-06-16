# -*- coding: utf-8 -*-
with open('/home/D-MUJERES-TRACCAR/traccar/l10n/es-CumN_0FF.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    ("I=`Conductores`", "I=`Empleados`"),
    ("L=`Conductor`", "L=`Empleado`"),
    ("Z=`Dispositivo`", "Z=`Colaborador`"),
    ("Se=`Buscar Dispositivos`", "Se=`Buscar Colaboradores`"),
    ("Ot=`Contraseña de dispositivo`", "Ot=`Contraseña de colaborador`"),
    ("kt=`Imagen del dispositivo`", "kt=`Imagen del colaborador`"),
    ("At=`Inicio de inactividad del dispositivo`", "At=`Inicio de inactividad`"),
    ("jt=`Periodo de inactividad del dispositivo`", "jt=`Periodo de inactividad`"),
    ("Ht=`Pushover Nombres de Dispositivo`", "Ht=`Pushover Nombres de Colaborador`"),
    ("sn=`UI: Desactivar características del vehículo`", "sn=`UI: Desactivar características de vehículo`"),
    ("cn=`UI: Desactivar Conductores`", "cn=`UI: Desactivar Empleados`"),
    ("Kn=`Límite de dispositivos`", "Kn=`Límite de colaboradores`"),
    ("Jn=`Dispositivo Solo Lectura`", "Jn=`Colaborador Solo Lectura`"),
    ("xr=`Dispositivos y Estado`", "xr=`Colaboradores y Estado`"),
    ("Sr=`Dispositivo seleccionado`", "Sr=`Colaborador seleccionado`"),
    ("Cr=`Dispositivos`", "Cr=`Colaboradores`"),
    ("wr=`Título del dispositivo`", "wr=`Título del colaborador`"),
    ("Tr=`Detalles del dispositivo`", "Tr=`Detalles del colaborador`"),
    ("zr=`Registre su primer dispositivo`", "zr=`Registre su primer colaborador`"),
    ("Br=`El IMEI, numero de serie u otro id, tiene que ser igual que el identificador del dispositivo que reporta al servidor.`",
     "Br=`El identificador tiene que ser igual que el ID del dispositivo que reporta al servidor.`"),
    ("fi=`Dispositivos`", "fi=`Colaboradores`"),
    ("Ci=`Hora del dispositivo`", "Ci=`Hora del colaborador`"),
    ("Ta=`Temperatura del dispositivo`", "Ta=`Temperatura del colaborador`"),
    ("Fa=`ID única del conductor`", "Fa=`ID único del colaborador`"),
    ("Qa=`Deshabilitar poder Compartir Dispositivos`", "Qa=`Deshabilitar poder Compartir Colaboradores`"),
    ("Ss=`Identificación de Dispositivo`", "Ss=`Identificación del Colaborador`"),
    ("ec=`Obtener Estatus de Dispositivo`", "ec=`Obtener Estatus de Colaborador`"),
    ("Cc=`Dispositivo en Línea`", "Cc=`Colaborador en Línea`"),
    ("wc=`Dispositivo en estado Desconocido`", "wc=`Colaborador en estado Desconocido`"),
    ("Tc=`Dispositivo Fuera de Línea`", "Tc=`Colaborador Fuera de Línea`"),
    ("Ec=`Dispositivo Inactivo`", "Ec=`Colaborador Inactivo`"),
    ("Oc=`Dispositivo en Movimiento`", "Oc=`Colaborador en Movimiento`"),
    ("kc=`Dispositivo Detenido`", "kc=`Colaborador Detenido`"),
    ("Ic=`Dispositivo vinculado cerca`", "Ic=`Colaborador vinculado cerca`"),
    ("Lc=`Dispositivo vinculado alejado`", "Lc=`Colaborador vinculado alejado`"),
    ("Wc=`El conductor ha cambiado`", "Wc=`El colaborador ha cambiado`"),
    ("dl=`El Dispositivo ha entrado a la Geo-Zona`", "dl=`El Colaborador ha entrado a la Geo-Zona`"),
    ("fl=`El Dispositivo ha salido de la Geo-Zona`", "fl=`El Colaborador ha salido de la Geo-Zona`"),
    ("Pl=`Todos los dispositivos`", "Pl=`Todos los colaboradores`"),
    ("Fl=`Vincular Geo-Zonas a dispositivos o grupos para recibir estos eventos.`",
     "Fl=`Vincular Geo-Zonas a colaboradores o grupos para recibir estos eventos.`"),
    ("Lu=`Dispositivos activos`", "Lu=`Colaboradores activos`"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('/home/D-MUJERES-TRACCAR/traccar/l10n/es-CumN_0FF.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Reemplazo completado exitosamente.")
