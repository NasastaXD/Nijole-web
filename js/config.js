/*
 * Todo lo personal vive acá: nombres, la carta, los niveles y el contenido del manual.
 * Editá este archivo y listo; el resto del código lo lee.
 *
 * Tipos de nivel:
 *   respuesta  → pregunta con respuesta numérica (o "digitos" para comparar solo dígitos)
 *   meme       → imagen chistosa de intermedio
 *   rickroll   → link a YouTube que hay que abrir para pasar
 *   poema      → texto libre con validación
 *   jefe       → jefe intermedio: la novela visual de "facu" (más abajo)
 * Para agregar más memes: copiá un bloque { tipo: "meme", ... }, poné la imagen en assets/memes/
 * y cambiá "imagen". "texto" es opcional. Cada bloque nuevo es una rosa más; el orden de la lista es el orden del juego.
 */
window.CONFIG = {
  ella: "Nijole",

  carta: {
    saludo: "To my favorite person,",
    parrafos: [
      "I made you a little web game. Partly for the laughs, partly as an excuse to practice coding video games in HTML. So please, don't take it too seriously.",
      "Beat everything and you unlock my official user manual, with all you need to know about what I like, what makes me happy, and how to operate me properly.",
      "Two more things. I love you very, very much. And by continuing, you agree to cosplay Maomao or Frieren, sooner or later. This clause is non-negotiable.",
      "Good luck. You will need it.",
    ],
    despedida: "Yours, always",
    terminos:
      "I accept the terms and conditions, including the Maomao or Frieren cosplay clause (sooner or later).",
  },

  niveles: [
    {
      tipo: "respuesta",
      tema: "Precálculo",
      titulo: "Calentamiento exponencial",
      enunciado: "Para entrar en calor. Resolvé para <i>x</i>:",
      formula: "3<sup>2x − 1</sup> = 243",
      respuesta: 3,
      pista: "243 = 3<sup>5</sup>. Igualá los exponentes y despejá.",
      exito: "x = 3. Inteligente y linda: injusto para el resto de la humanidad.",
    },
    {
      tipo: "respuesta",
      tema: "Precálculo",
      titulo: "Funciones que se abrazan",
      enunciado: "Sean <i>f</i>(<i>x</i>) = 2<i>x</i> + 3 y <i>g</i>(<i>x</i>) = <i>x</i><sup>2</sup> − 1. Calculá:",
      formula: "<i>f</i>(<i>g</i>(3)) − <i>g</i>(<i>f</i>(0))",
      respuesta: 11,
      pista: "<i>g</i>(3) = 8, así que <i>f</i>(<i>g</i>(3)) = <i>f</i>(8). Después hacé lo mismo al revés empezando por <i>f</i>(0).",
      exito: "11. Como las veces que pienso en vos por hora (mínimo).",
    },
    {
      tipo: "meme",
      tema: "Intermedio",
      titulo: "Pausa técnica",
      imagen: "assets/memes/estabilidad-economica.jpg",
      alt: "Meme: «Mi fantasía sexual es llegar a la adultez teniendo una estabilidad económica».",
      texto: "Recordatorio motivacional de por qué estamos estudiando precálculo.",
    },
    {
      tipo: "respuesta",
      tema: "Trigonometría",
      titulo: "La identidad del 67",
      enunciado: "Sin calculadora (te estoy mirando). ¿Cuánto vale esto?",
      formula: "sin<sup>2</sup>(67°) + cos<sup>2</sup>(67°)",
      respuesta: 1,
      pista: "Identidad pitagórica: sin<sup>2</sup>θ + cos<sup>2</sup>θ da siempre lo mismo, sea cual sea el ángulo.",
      exito: "1. El 67 apareció y no pasó nada. Por ahora.",
      especiales: { 67: "No, no todo es 67. Casi todo, pero esto no." },
    },
    {
      tipo: "meme",
      tema: "Intermedio",
      titulo: "Clase de programación",
      imagen: "assets/memes/kurimanju-javascript.jpg",
      alt: "Meme: Kurimanju con un video titulado «cómo hacer marihuana usando maizena y javascript».",
    },
    {
      tipo: "respuesta",
      tema: "Trigonometría",
      titulo: "La escalera del amor",
      enunciado:
        "Para llegar a tu ventana apoyo una escalera de 8 m contra la pared. La escalera forma un ángulo de 30° con el piso. ¿A qué altura de la pared llega? (en metros)",
      formula: "h = ?",
      respuesta: 4,
      pista: "h = 8 · sin(30°), y sin(30°) = 1/2.",
      exito: "4 metros. Perfecto, ya sé qué escalera comprar.",
    },
    {
      tipo: "meme",
      tema: "Intermedio",
      titulo: "Anuncio importante",
      imagen: "assets/memes/kurimanju-sucs.jpg",
      alt: "Meme: Chiikawa llorando con el título «Me voy para siempre porque solo tengo 2 sucs».",
    },
    {
      tipo: "rickroll",
      tema: "Material de estudio",
      titulo: "Clase magistral",
      texto:
        "Antes de la integral final tenés que repasar. Mi profe me pasó esta clase sobre integrales definidas y dicen que te cambia la vida. Mirala (aunque sea los primeros 20 segundos) y volvé.",
      boton: "Ver la clase en YouTube",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      despues:
        "Never gonna give you up, never gonna let you down… Te rickrolleé. Nivel aprobado por tener fe en mí.",
    },
    {
      tipo: "poema",
      tema: "Literatura",
      titulo: "Oda al 67",
      enunciado:
        "Pregunta de temática libre. Escribí un poema sobre tu amor al 67. Reglas: mínimo 4 versos (uno por línea) y el 67 tiene que aparecer al menos una vez.",
      placeholder: "Oh, 67, número sin igual…",
      minVersos: 4,
      exito:
        "Publicado. La Real Academia del 67 te otorga el premio Six Seven de Oro. Tu poema queda en el anexo del manual.",
    },
    {
      tipo: "meme",
      tema: "Intermedio",
      titulo: "Pausa poética",
      imagen: "assets/memes/lluvia.jpg",
      alt: "Meme: «La lluvia era mi sonido favorito hasta que te escuché mear».",
      texto: "Hablando de poesía…",
    },
    {
      tipo: "jefe",
      tema: "Jefe intermedio",
      titulo: "Facu-lo",
      sprite: "assets/facu-lo.png",
    },
    {
      tipo: "respuesta",
      tema: "Precálculo",
      titulo: "Raíces sospechosas",
      enunciado:
        "Hallá las raíces de esta ecuación. Escribilas juntas, de menor a mayor, sin espacios ni comas.",
      formula: "<i>x</i><sup>2</sup> − 13<i>x</i> + 42 = 0",
      respuesta: "67",
      comparar: "digitos",
      pista: "Buscá dos números que sumados den 13 y multiplicados den 42.",
      exito: "6 y 7. SIX SEVEN. Lo sé, me superé.",
      especiales: { 76: "Al revés. De menor a mayor, genia." },
    },
    {
      tipo: "meme",
      tema: "Intermedio",
      titulo: "Hora de los elogios",
      imagen: "assets/memes/frieren-elogios.jpg",
      alt: "Panel de Frieren: «Feel free to praise me more».",
    },
    {
      tipo: "respuesta",
      tema: "Cálculo",
      titulo: "La integral final",
      enunciado: "La última, prometido. Calculá:",
      formula:
        '<span class="int">∫<span class="lims"><span>2</span><span>0</span></span></span>(3<i>x</i><sup>2</sup> + 2<i>x</i>) d<i>x</i>',
      respuesta: 12,
      pista: "Una antiderivada es <i>x</i><sup>3</sup> + <i>x</i><sup>2</sup>. Evaluala en 2 y restale lo que da en 0.",
      exito: "12. Sobreviviste al cálculo. Ahora viene lo difícil: Usagi tiene hambre.",
    },
    {
      tipo: "meme",
      tema: "Intermedio",
      titulo: "Una advertencia",
      imagen: "assets/memes/gato-ultimo.jpg",
      alt: "Meme: un gato con el texto «El que ríe al último ríe al final».",
    },
  ],

  jefe: {
    titulo: "El hambre de Usagi",
    segundos: 60,
    pesoInicial: 10,
    pesoMeta: 100,
  },

  // Jefe intermedio: novela visual de decisiones.
  //  · Seguir con él pierde (reintenta la pelea).
  //  · Terminar de migajera borra todo el progreso.
  //  · Cortar con DIGNIDAD suficiente pasa al siguiente nivel.
  // Cada línea es [quién, texto]: "narr" (narrador), "facu" o "vos". Un tercer valor opcional
  // dispara una reacción del sprite: "shake", "jump", "slump" o "flush".
  // "ir" apunta a otra escena, o a un final con "fin:ganar", "fin:seguir" o "fin:migajera".
  facu: {
    nombre: "Facu-lo",
    dignidadInicial: 50,
    dignidadParaCortar: 60,
    inicio: "inicio",
    escenas: {
      inicio: {
        lineas: [
          ["narr", "* Un olor conocido se mete entre las rosas."],
          ["narr", "* ¡Facu-lo apareció!", "jump"],
          ["facu", "Holaaa. Estaba pensando en vos. Bueno, en vos y en la playlist de las 3 am."],
        ],
        opciones: [
          { texto: "Hola, Facu. ¿Qué querés?", dignidad: 0, ir: "queria" },
          { texto: "Visto.", dignidad: 15, ir: "visto" },
          { texto: "¡Yo también te extrañé!", dignidad: -15, ir: "extranar" },
        ],
      },
      visto: {
        lineas: [
          ["narr", "* Lo dejaste en visto. Facu-lo se pone nervioso.", "shake"],
          ["facu", "¿Ya me ignorás? Yo solo quería saber si estabas bien... y si todavía tenés mi buzo."],
        ],
        opciones: [
          { texto: "El buzo lo quemé en una fogata.", dignidad: 15, ir: "etapa" },
          { texto: "Tomá, te lo llevo. Total nos vemos un ratito.", dignidad: -15, ir: "extranar" },
        ],
      },
      extranar: {
        lineas: [
          ["facu", "Ay, yo también. Qué linda que sos. Che, ¿y si nos vemos? Sin compromiso, obvio. Yo no estoy para compromisos."],
        ],
        opciones: [
          { texto: "Dale, sin compromiso.", ir: "fin:migajera" },
          { texto: "Esperá. ¿Sin compromiso? Repetime eso.", dignidad: 10, ir: "queria" },
          { texto: "Jajaja, ¿en serio? Chau.", dignidad: 10, ir: "etapa" },
        ],
      },
      queria: {
        lineas: [
          ["facu", "Nada, nada. Solo quería contarte que cambié. Ahora medito. Bueno, lo intenté una vez."],
        ],
        opciones: [
          { texto: "¿Cambiaste? ¿Entonces ya contestás los mensajes en menos de tres días?", dignidad: 10, ir: "etapa" },
          { texto: "¿En serio cambiaste? Qué lindo...", dignidad: -10, ir: "creer" },
          { texto: "Mostrame el certificado de cambio.", dignidad: 5, ir: "etapa" },
        ],
      },
      creer: {
        lineas: [
          ["facu", "En serio. Dame otra chance y te prometo una versión mejorada. Facu-lo 2.0."],
        ],
        opciones: [
          { texto: "Bueno... una chance más.", ir: "fin:seguir" },
          { texto: "Facu-lo 2.0 sigue siendo Facu-lo.", dignidad: 15, ir: "etapa" },
          { texto: "¿Y si somos amigos? Pero amigos que se besan.", ir: "fin:migajera" },
        ],
      },
      etapa: {
        lineas: [
          ["narr", "* Facu-lo cambia de estrategia."],
          ["facu", "Mirá, yo te quiero, pero no estoy listo. Es que estoy en mi etapa. No es por vos, es por mí. Es por mi signo."],
        ],
        opciones: [
          { texto: "No sos vos, soy yo... ah no, sos vos.", dignidad: 10, ir: "historia" },
          { texto: "Entiendo. Te espero hasta que estés listo.", ir: "fin:migajera" },
          { texto: "¿Tu etapa tiene fecha de vencimiento?", dignidad: 10, ir: "historia" },
        ],
      },
      historia: {
        lineas: [
          ["facu", "Ayer vi tu historia y le puse un corazón. ¿Eso no cuenta como que me importás?"],
        ],
        opciones: [
          { texto: "Un corazón de Instagram no es amor, Facu.", dignidad: 10, ir: "culpa" },
          { texto: "Ay, es verdad, me puso un corazón...", dignidad: -15, ir: "culpa" },
          { texto: "Yo también te puse corazones, ¡mirá!", dignidad: -10, ir: "culpa" },
        ],
      },
      culpa: {
        lineas: [
          ["narr", "* Facu-lo se pone dramático.", "slump"],
          ["facu", "Sin vos no soy nadie. Bueno, soy alguien, pero un alguien triste. Y con ojeras."],
        ],
        opciones: [
          { texto: "Eso no es mi problema.", dignidad: 15, ir: "final" },
          { texto: "Pobrecito, no llores...", dignidad: -10, ir: "final" },
          { texto: "Te preparo unos fideos.", dignidad: -15, ir: "final" },
        ],
      },
      final: {
        lineas: [
          ["narr", "* Facu-lo se quedó sin excusas."],
          ["facu", "Entonces... ¿qué hacemos? ¿Volvemos?"],
        ],
        opciones: [
          { texto: "Sí, volvamos.", ir: "fin:seguir" },
          { texto: "Quedemos como «algo». Sin etiquetas.", ir: "fin:migajera" },
          { texto: "Se terminó, Facu. Chau.", requiere: 60, ir: "fin:ganar" },
        ],
      },
    },
    finales: {
      ganar: {
        titulo: "¡Terminaste con Facu-lo!",
        lineas: [
          ["facu", "¿Me estás cortando? Pero si yo ni te dije que éramos algo."],
          ["narr", "* Exacto."],
          ["narr", "* Facu-lo fue arrastrado por la cadena del baño.", "flush"],
          ["narr", "* Ganaste. Tu DIGNIDAD quedó intacta."],
        ],
      },
      seguir: {
        titulo: "GAME OVER",
        texto: "Seguiste con Facu-lo. Perdiste.",
        lineas: [
          ["narr", "* Volviste con Facu-lo."],
          ["narr", "* A los tres días te dejó en visto.", "slump"],
        ],
      },
      migajera: {
        titulo: "MIGAJERA",
        texto: "Perdiste todo tu progreso.",
        lineas: [
          ["narr", "* Terminaste de migajera."],
          ["narr", "* Meses respondiendo «jajaja» a sus historias de las 3 am.", "jump"],
        ],
      },
    },
  },

  // Contenido del PDF. Lo que está entre [corchetes] es para que lo completes vos.
  manual: {
    // Mientras tenga texto, el PDF es solo este mensaje. Cuando el manual esté listo, poné pendiente: null y se genera el manual completo de abajo.
    pendiente: "Aún no hice el manual, cffff. Luego te lo paso",
    producto: "Novio",
    modelo: "Modelo 2026 · Rev. 1.0",
    numeroSerie: "SN-0067-2026",
    intro:
      "Felicitaciones por adquirir este novio. Este manual contiene la información necesaria para su uso, cuidado y mantenimiento. Léalo con atención y consérvelo para futuras consultas.",
    advertencias: [
      "No dejar sin comida por más de 4 horas. Puede volverse irritable.",
      "No exponer a spoilers de series que todavía no terminó.",
      "Este producto emite chistes malos sin previo aviso. Es parte de su funcionamiento normal.",
    ],
    especificaciones: [
      ["Nombre del modelo", "[tu nombre]"],
      ["Combustible principal", "[tu comida favorita]"],
      ["Bebida de recarga", "[tu bebida favorita]"],
      ["Horas de sueño necesarias", "[cuántas]"],
      ["Batería social", "[alta / media / se agota rápido]"],
      ["Temperatura de uso", "[friolento / caluroso]"],
      ["Lenguaje del amor", "[el tuyo]"],
    ],
    meGusta: [
      "[Cosa que te gusta 1]",
      "[Cosa que te gusta 2]",
      "[Cosa que te gusta 3]",
      "[Cosa que te gusta 4]",
      "[Cosa que te gusta 5]",
    ],
    meAgrada: [
      "[Gesto chiquito que te pone feliz 1]",
      "[Gesto chiquito que te pone feliz 2]",
      "[Gesto chiquito que te pone feliz 3]",
    ],
    noMeGusta: [
      "[Cosa que no te gusta 1]",
      "[Cosa que no te gusta 2]",
      "[Cosa que no te gusta 3]",
    ],
    problemas: [
      { sintoma: "Está callado y serio", causa: "Hambre (95 % de los casos)", solucion: "Alimentar. Repetir si persiste." },
      { sintoma: "Responde con monosílabos", causa: "Sueño o cansancio", solucion: "Permitir una siesta. No discutir temas importantes en este modo." },
      { sintoma: "Está insoportable de cariñoso", causa: "Funcionamiento normal", solucion: "Ninguna. Disfrutar." },
      { sintoma: "Habla de código 40 minutos seguidos", causa: "Le salió algo", solucion: "Asentir y decir «qué genio»." },
      { sintoma: "[un síntoma tuyo]", causa: "[la causa]", solucion: "[cómo se arregla]" },
    ],
    mantenimiento: [
      "Abrazos diarios. Dosis mínima recomendada: 3.",
      "Comida rica al menos una vez por semana.",
      "[otro cuidado que necesites]",
    ],
    garantia:
      "Este producto tiene garantía de por vida. La garantía no cubre daños causados por: (a) ignorar este manual, (b) comerse su comida sin preguntar, (c) no cumplir con el cosplay de Maomao o Frieren en un plazo razonable.",
  },
};
