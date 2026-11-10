// SISTEMA DE TIPOS: todo lo editable está aquí.
// Triángulo: Rushdown > Zoner > Grappler > Rushdown ("vence" = tipo al que le gana)

// Multiplicador del daño: ventaja = el atacante gana al defensor | desventaja = el atacante pierde contra él
export const MULTIPLICADORES = { ventaja: 1.25, desventaja: 0.75 };

// Textos de los botones (info = texto al pasar el ratón por encima)
export const ACCIONES = {
  atacar:   { nombre: "Atacar",   info: "Ataca al rival" },
  defender: { nombre: "Defender", info: "Gasta un turno: reduce a la mitad el siguiente daño recibido" },
  rush:     { nombre: "Rush",     info: "Gana un turno extra (una vez por pelea). No gasta turno" },
  negar:    { nombre: "Negar",    info: "Gasta un turno: anula por completo el siguiente ataque del rival" },
  huir:     { nombre: "Huir",     info: "Abandonar la pelea y volver al menú" },
};

// turnosPorRonda: acciones seguidas que hace antes de pasar el turno al rival
// accionSecundaria: botón que sustituye a "Defender" para ese tipo
export const TIPOS = {
  rushdown: { nombre: "Rushdown", vence: "zoner",    turnosPorRonda: 2, accionSecundaria: "rush",
              rush: { usosPorPelea: 1, turnosExtra: 1 } },        // al agotar los usos, vuelve "Defender"
  zoner:    { nombre: "Zoner",    vence: "grappler", turnosPorRonda: 1, accionSecundaria: "negar" },
  grappler: { nombre: "Grappler", vence: "rushdown", turnosPorRonda: 1, accionSecundaria: "defender",
              multiplicadorTrasDefender: 2 },                     // tras defender, su siguiente ataque hace x2
};
