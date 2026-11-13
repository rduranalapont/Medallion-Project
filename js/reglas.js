// REGLAS del combate (sin HTML ni canvas): turnos, daño y acciones. combate.js las usa y muestra el resultado.
import { TIPOS, MULTIPLICADORES } from "./data/tipos.js";

export function multiplicadorTipo(atacante, defensor) {
  if (TIPOS[atacante].vence === defensor) return MULTIPLICADORES.ventaja;
  if (TIPOS[defensor].vence === atacante) return MULTIPLICADORES.desventaja;
  return 1;
}

const luchador = (d, vida) => ({
  nombre: d.nombre, tipo: d.tipo, color: d.color, vida, vidaMax: vida, danio: d.danio, tamano: d.tamano ?? 1, sprite: d.sprite ?? null, anclaX: d.anclaX ?? 0.5, retrato: d.retrato ?? null,
  guardia: false,   // true = reduce a la mitad el próximo daño recibido
  negar: false,     // true = anula el próximo ataque recibido
  bonus: 1,         // multiplicador de su próximo ataque (grappler tras defender)
  rushUsos: 0,
});

export function crearBatalla(personaje, enemigo) {
  return {
    jugador: luchador(personaje, personaje.vida),
    enemigo: luchador(enemigo, enemigo.vidaMax),
    ronda: 1,                                           // sube cada vez que vuelve el turno al jugador
    turno: "jugador",                                   // "jugador" | "enemigo" | "fin"
    restantes: TIPOS[personaje.tipo].turnosPorRonda,    // acciones que le quedan a quien tiene el turno
    ganador: null,
  };
}

// Qué botón sustituye a "Defender" ahora mismo
export function accionSecundaria(u) {
  const T = TIPOS[u.tipo];
  return T.accionSecundaria === "rush" && u.rushUsos >= T.rush.usosPorPelea ? "defender" : T.accionSecundaria;
}

function atacar(u, o) {
  const mult = multiplicadorTipo(u.tipo, o.tipo), potenciado = u.bonus > 1;
  let danio = Math.max(1, Math.round(u.danio * mult * u.bonus));
  u.bonus = 1;
  if (o.negar) { o.negar = false; return `${o.nombre} niega el ataque de ${u.nombre}`; }
  const guardia = o.guardia;
  if (guardia) { danio = Math.ceil(danio / 2); o.guardia = false; }
  o.vida = Math.max(0, o.vida - danio);
  return `${u.nombre} ataca e inflige ${danio} de daño`
    + (potenciado ? " ¡Golpe potenciado!" : "")
    + (mult > 1 ? " ¡Ventaja de tipo!" : mult < 1 ? " Desventaja de tipo" : "")
    + (guardia ? " (guardia)" : "");
}

// Ejecuta una acción de "jugador" o "enemigo" y devuelve el mensaje. Gestiona también el cambio de turno.
export function ejecutarAccion(b, quien, accion) {
  const u = b[quien], o = b[quien === "jugador" ? "enemigo" : "jugador"], T = TIPOS[u.tipo];
  if (accion !== "atacar" && accion !== accionSecundaria(u)) return "";
  let msg = "", gastaTurno = true;

  if (accion === "atacar") msg = atacar(u, o);
  else if (accion === "defender") {
    u.guardia = true; u.bonus = T.multiplicadorTrasDefender ?? 1;
    msg = `${u.nombre} se pone en guardia`;
  } else if (accion === "negar") {
    u.negar = true; msg = `${u.nombre} se prepara para negar el siguiente ataque`;
  } else if (accion === "rush") {
    u.rushUsos++; b.restantes += T.rush.turnosExtra; gastaTurno = false;
    msg = `¡${u.nombre} se lanza al ataque! Gana un turno extra`;
  }

  if (o.vida <= 0) { b.turno = "fin"; b.ganador = quien; return msg; }
  if (gastaTurno) b.restantes--;
  if (b.restantes <= 0) {                               // pasa el turno al rival
    b.turno = quien === "jugador" ? "enemigo" : "jugador";
    b.restantes = TIPOS[b[b.turno].tipo].turnosPorRonda;
    if (b.turno === "jugador") b.ronda++;
  }
  return msg;
}
