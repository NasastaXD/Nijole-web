# Manual de Usagi

Juego web para Nijole: un sobre lacrado, una carta, una enredadera de 10 rosas (cada una es un nivel), un jefe final con Usagi en dos fases y, al final, un manual en PDF.

El jefe final:

1. **Space Invaders**: Usagi saca la lengua para comer dulces y tiene que pasar de 10 kg a 100 kg en 60 s.
2. **La traición**: ya obesa, Usagi te ataca. Es un combate estilo Undertale: elegís LUCHAR, ACTUAR, OBJETO o PIEDAD, esquivás sus ataques con el corazón durante 7 turnos y al final la perdonás. Si perdés, retomás desde esta fase con más HP.

## Qué editar

Todo lo personal está en `js/config.js`:

- `ella` y `carta`: su nombre y la carta de bienvenida (en inglés).
- `niveles`: las 10 rosas. Hay cuatro tipos: `respuesta`, `meme`, `rickroll` y `poema`. Para sumar un meme, copiá un bloque `{ tipo: "meme", ... }`, poné la imagen en `assets/memes/` y apuntá `imagen` a ese archivo.
- `jefe`: tiempo y pesos de la primera fase (por defecto 60 s, de 10 kg a 100 kg). Los diálogos y ataques de la segunda fase están en `js/battle.js`.
- `manual`: el contenido del PDF. Todo lo que está entre `[corchetes]` es para completar.

## Probarlo

Es un sitio estático, sin build. Cualquier servidor sirve:

```sh
npx http-server .
```

Para saltar el candado de los niveles mientras probás, abrí la página con `#dev` al final de la URL. Con `#god` el combate contra Usagi no hace daño, para ver el final sin esquivar. El botón "Reiniciar progreso" del pie borra el avance guardado en el navegador.

## Publicarlo

En GitHub: Settings → Pages → Deploy from a branch → `main` / root.
