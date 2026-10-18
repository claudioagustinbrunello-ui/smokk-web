# SMOKK — PWA musical (primera vista)

Prototipo inicial en HTML, CSS y JavaScript para GitHub Pages. Incluye introducción con elección de música, fondo de video aleatorio, sección biográfica, reproductor de canciones, video destacado de YouTube, redes sociales y base para Decap CMS.

## Carpetas de material

- `material/imagenes/personaje.png`: única figura recortada, con fondo transparente.
- `material/imagenes/fondo.jpg`: fondo de esa misma composición. Es una sola imagen dividida en dos capas: personaje + fondo.
- `material/videos/fondo1.mp4` a `fondo4.mp4`: videos de fondo; se reproducen muteados.
- `material/canciones/`: archivos de audio.
- `material/canciones/lista.json`: lista de canciones que verá el reproductor.
- `content/site.json`: redes, contacto y video permanente.
- `content/lanzamientos.json`: lanzamientos administrados con Decap CMS.

## Publicar en GitHub Pages

1. Subí todos los archivos del ZIP a la raíz de un repositorio.
2. En GitHub, abrí **Settings → Pages** y seleccioná la rama `main` y la carpeta `/ (root)`.
3. Esperá a que GitHub publique el sitio. La PWA requiere HTTPS; GitHub Pages lo proporciona.
4. Reemplazá los archivos de ejemplo por los recursos reales del artista.

## Decap CMS

1. En `admin/config.yml`, reemplazá `TU-USUARIO/TU-REPOSITORIO` por el repositorio real.
2. Configurá autenticación OAuth para GitHub compatible con Decap CMS. No compartas tokens ni claves privadas en este repositorio público.
3. Abrí `/admin/` en el sitio publicado.
4. La configuración permite editar redes, contacto, video permanente y lanzamientos.
5. El flujo editorial de Decap requiere configuración adecuada de autenticación y permisos en GitHub.

## Importante sobre funciones

- La página permite guardar una fecha futura y no mostrar el lanzamiento hasta que esa fecha llegue, siempre que el sitio esté actualizado con el contenido. Esto **no programa automáticamente un commit futuro ni envía notificaciones**.
- Las notificaciones quedan fuera de esta primera versión, tal como se acordó.
- GitHub Pages es alojamiento estático. Decap CMS modifica archivos del repositorio; el envío de notificaciones o tareas programadas requeriría servicios adicionales.
- El botón de instalación aparece cuando el navegador ofrece el evento de instalación. En iPhone se deben seguir las instrucciones de Safari para añadir la web a la pantalla de inicio.
- El audio solo comienza después de que el visitante elige «Entrar con música».
- Los videos deben ser propios o contar con autorización de uso. Los archivos de música también deben estar autorizados para publicación y reproducción.

## Perfil y biografía

La biografía se redactó con los datos proporcionados por el propietario del proyecto. Antes de publicar, confirmá los créditos exactos de colaboraciones y producciones para evitar atribuciones incorrectas.
