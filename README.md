# Manual de Usagi

Juego web para Nijole: un sobre lacrado, una carta, una enredadera de 10 rosas (cada una es un nivel), un jefe final estilo Space Invaders con Usagi y, al final, un manual en PDF.

## Qué editar

Todo lo personal está en `js/config.js`:

- `ella`, `firma` y `carta`: nombres y la carta de bienvenida (en inglés).
- `niveles`: las 10 rosas. Hay cuatro tipos: `respuesta`, `meme`, `rickroll` y `poema`. Para sumar un meme, copiá un bloque `{ tipo: "meme", ... }`, poné la imagen en `assets/memes/` y apuntá `imagen` a ese archivo.
- `jefe`: tiempo y pesos del minijuego (por defecto 60 s, de 10 kg a 100 kg).
- `manual`: el contenido del PDF. Todo lo que está entre `[corchetes]` es para completar.

## Probarlo

Es un sitio estático, sin build. Cualquier servidor sirve:

```sh
npx http-server .
```

Para saltar el candado de los niveles mientras probás, abrí la página con `#dev` al final de la URL. El botón "Reiniciar progreso" del pie borra el avance guardado en el navegador.

## Publicarlo

En GitHub: Settings → Pages → Deploy from a branch → `main` / root.
