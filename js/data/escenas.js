// ESCENAS DE DIÁLOGO. Se lanzan desde js/data/capitulos.js (al empezar, al terminar o con un "trigger" durante el combate).
//
// tipo:
//   "cinematica" = pantalla completa con imagen de fondo (para inicio/final de capítulo)
//   "dialogo"    = texto sobre el combate (fondo oscurecido) con el arte del personaje que habla
//
// Cada línea admite:
//   texto      (obligatorio)
//   personaje  "jugador" (la medalla cargada) | "enemigo" (el del capítulo) | un id de personajes.js | nada = narrador
//   hablante   nombre que se muestra en la etiqueta amarilla (si no, se usa el del personaje; p. ej. "¿DESCONOCIDA?")
//   fondo      (cinemáticas) imagen de fondo; se mantiene hasta que otra línea la cambie
//   lado       "izquierda" | "derecha" (dónde se coloca el arte; por defecto: jugador a la derecha, enemigo a la izquierda)
//   imagen     arte propio para esa línea (si no, se usa el "splash" del personaje)
//   boton      { texto, accion }  botón de elección en esa línea (la escena no termina hasta pulsarlo). Acciones: ver ACCIONES en escenas.js
export const ESCENAS = {
  // ----- Introducción al mundo (primera vez que se entra en Capítulos; repetible desde ese menú) -----
  intro_mundo: { tipo: "cinematica", fondo: "img/fondos/placeholder_noche.jpg", lineas: [
    { texto: "Hace mucho tiempo, los recuerdos de este mundo quedaron encerrados en pequeñas medallas." },
    { texto: "Cada medalla guarda a alguien: su nombre, su fuerza... y su historia." },
    { fondo: "img/fondos/placeholder_dia.jpg", texto: "Pero ahora las medallas están vacías, y una amenaza sin nombre avanza sobre todo lo que queda." },
    { texto: "Para plantarle cara necesitas a alguien a quien invocar. Entre tus manos tienes una medalla en blanco...",
      boton: { texto: "Introducir NFC vacío", accion: "reclutarIntroductorio" } },
  ]},

  // ----- Capítulo 0 -----
  cap0_inicio: { tipo: "cinematica", fondo: "img/fondos/placeholder_dia.jpg", lineas: [
    { texto: "El mundo lleva días en silencio. Nadie recuerda cuándo empezó." },
    { personaje: "jugador", texto: "No sé qué es esta medalla... pero parece responder a mí." },
    { personaje: "jugador", fondo: "img/fondos/placeholder_noche.jpg", texto: "Algo se acerca entre las sombras. Tengo que estar preparada." },
  ]},
  cap0_ronda3: { tipo: "dialogo", lineas: [
    { personaje: "enemigo", texto: "No podrás detenerme... nadie recuerda cómo hacerlo." },
  ]},
  cap0_enemigo_herido: { tipo: "dialogo", lineas: [
    { personaje: "jugador", texto: "¡Solo queda un poco más! ¡Adelante!" },
  ]},
  cap0_peligro: { tipo: "dialogo", lineas: [
    { personaje: "jugador", texto: "Todavía puedo seguir... no pienso rendirme ahora." },
  ]},
  cap0_final: { tipo: "cinematica", fondo: "img/fondos/placeholder_dia.jpg", lineas: [
    { personaje: "jugador", texto: "Se ha desvanecido... y la medalla sigue brillando." },
    { texto: "Algo, en algún lugar, ha empezado a despertar." },
  ]},

  // ----- Capítulo 1 -----
  cap1_inicio: { tipo: "cinematica", fondo: "img/fondos/placeholder_noche.jpg", lineas: [
    { texto: "El camino está cubierto de ceniza. Unos ojos brillan entre la niebla." },
  ]},
  cap1_enemigo_herido: { tipo: "dialogo", lineas: [
    { personaje: "enemigo", texto: "Grrr..." },
    { personaje: "jugador", texto: "¡Está flaqueando! ¡Ahora!" },
  ]},

  // ----- Capítulo 2 -----
  cap2_inicio: { tipo: "cinematica", fondo: "img/fondos/placeholder_noche.jpg", lineas: [
    { personaje: "enemigo", texto: "Has llegado hasta aquí. Es todo lo que podrás conseguir." },
  ]},
  cap2_peligro: { tipo: "dialogo", lineas: [
    { personaje: "enemigo", texto: "¿Aún intentas resistir? Es inútil." },
    { personaje: "jugador", texto: "Esto no se puede ganar... será mejor huir." },
  ]},
};
