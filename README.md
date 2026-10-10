# Manual de Usagi

Juego web para Nijole: un sobre lacrado, una carta, una enredadera de rosas (cada una es un nivel, con memes de pausa en el medio), un jefe intermedio (Facu-lo, una novela visual), un jefe final con Usagi en dos fases y, al final, un manual en PDF. Tiene música y efectos de sonido.

El jefe intermedio es **Facu-lo**, una novela visual de decisiones con una barra de DIGNIDAD. Seguir con él pierde y reintenta la pelea; terminar de migajera borra todo el progreso; cortar con DIGNIDAD suficiente (60) pasa al siguiente nivel.

El jefe final:

1. **Space Invaders**: Usagi saca la lengua para comer dulces y tiene que pasar de 10 kg a 100 kg en 60 s.
2. **La traición**: ya obesa, Usagi te ataca. Es un combate estilo Undertale: elegís LUCHAR, ACTUAR, OBJETO o PIEDAD, esquivás sus ataques con el corazón durante 7 turnos y al final la perdonás. Si perdés, retomás desde esta fase con más HP.

## Qué editar

Todo lo personal está en `js/config.js`:

- `ella` y `carta`: su nombre y la carta de bienvenida (en inglés).
- `niveles`: las rosas, en el orden en que se juegan. Hay cuatro tipos: `respuesta`, `meme`, `rickroll` y `poema`. Para sumar un meme, copiá un bloque `{ tipo: "meme", ... }`, poné la imagen en `assets/memes/` y apuntá `imagen` a ese archivo. Cada bloque nuevo es una rosa más.
- `facu`: el guion de la novela visual (escenas, opciones, cuánta DIGNIDAD suma o resta cada una y los tres finales). Está pensado para que le metas chistes que solo ustedes entienden.
- `jefe`: tiempo y pesos de la primera fase (por defecto 60 s, de 10 kg a 100 kg). Los diálogos y ataques de la segunda fase están en `js/battle.js`.
- `manual`: el PDF del final. Mientras `pendiente` tenga texto, el PDF es solo ese mensaje ("Aún no hice el manual, cffff. Luego te lo paso"). Cuando el manual esté listo, completá lo que está entre `[corchetes]` y poné `pendiente: null`.

## Sonido

La música y los efectos se sintetizan en el navegador con WebAudio (`js/audio.js`): no hay archivos de audio. Hay cuatro pistas (el sobre y la enredadera, el Space Invaders, la traición de Usagi y Facu-lo). El navegador solo deja sonar el audio después del primer toque, y el botón de arriba a la derecha lo silencia; la preferencia queda guardada.

## Probarlo

Es un sitio estático, sin build. Cualquier servidor sirve:

```sh
npx http-server .
```

Para saltar el candado de los niveles mientras probás, abrí la página con `#dev` al final de la URL. Con `#god` el combate contra Usagi no hace daño, para ver el final sin esquivar. El botón "Reiniciar progreso" del pie borra el avance guardado en el navegador.

## Publicarlo

Subir una rama `release/vX.Y.Z` (por ejemplo `git push origin HEAD:refs/heads/release/v1.0.1`) o una etiqueta `vX.Y.Z` dispara `.github/workflows/release.yml`, que arma `manual-de-usagi-vX.Y.Z.zip` y lo publica como release. Las instrucciones para subirlo a Hostinger están en `.github/release-notes.md`.

También sirve GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root.
