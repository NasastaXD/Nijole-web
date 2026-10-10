Sitio estático (HTML, CSS y JavaScript). No necesita PHP, base de datos ni build.

## Subirlo a Hostinger

1. Descargá el archivo `.zip` de la sección Assets, acá abajo.
2. En hPanel abrí el Administrador de archivos (File Manager) del dominio o subdominio donde lo querés.
3. Entrá a la carpeta `public_html` de ese sitio. Si ves la página de bienvenida de Hostinger en vez de la tuya, borrá `default.php` de esa carpeta.
4. Subí el zip y extraelo ahí mismo. Tiene que quedar `index.html` directamente en `public_html`, al lado de las carpetas `css`, `js` y `assets`.
5. Abrí el dominio desde el celular y probalo de punta a punta.

Si el dominio ya tiene otra web, extraé el zip dentro de una carpeta nueva de `public_html` (por ejemplo `regalo`) y entrá a `tudominio.com/regalo`. Las rutas son relativas, así que funciona igual.

## Notas

- Necesita conexión a internet: las tipografías vienen de Google Fonts y el generador de PDF de cdnjs.
- Para cambiar textos, niveles o el PDF final, editá `js/config.js` y volvé a subir ese archivo.
