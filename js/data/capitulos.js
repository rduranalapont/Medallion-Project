// Lista de capítulos del menú. "enemigo" = id de js/data/enemigos.js con el que se pelea.
// Escenas (ids de js/data/escenas.js):
//   escenaInicio = antes de la pelea | escenaFinal = tras ganarla
//   dialogos = escenas durante el combate. Cada una se lanza una sola vez cuando se cumplen TODAS sus condiciones ("cuando"):
//       inicio: true          nada más empezar la pelea
//       ronda: N              a partir de la ronda N (la ronda sube cada vez que te vuelve el turno)
//       enemigoVida: 0.5      cuando la vida del enemigo baja al 50 % o menos
//       jugadorVida: 0.4      cuando la vida del personaje baja al 40 % o menos
export const CAPITULOS = [
  { id: 0, titulo: "Capítulo 0", subtitulo: "El primer medallón",   enemigo: "generico_01",
    escenaInicio: "cap0_inicio", escenaFinal: "cap0_final",
    dialogos: [
      { escena: "cap0_ronda3",         cuando: { ronda: 3 } },
      { escena: "cap0_enemigo_herido", cuando: { enemigoVida: 0.5 } },
      { escena: "cap0_peligro",        cuando: { jugadorVida: 0.4 } },
    ] },
  { id: 1, titulo: "Capítulo 1", subtitulo: "Oleadas en el camino", enemigo: "lobo_ceniza",
    escenaInicio: "cap1_inicio",
    dialogos: [ { escena: "cap1_enemigo_herido", cuando: { enemigoVida: 0.5 } } ] },
  { id: 2, titulo: "Capítulo 2", subtitulo: "Rivales y aliados",    enemigo: "coloso_vacio",
    escenaInicio: "cap2_inicio",
    dialogos: [ { escena: "cap2_peligro", cuando: { jugadorVida: 0.5 } } ] },
];
