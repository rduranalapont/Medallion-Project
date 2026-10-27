// Pelea 1 contra 1 por turnos. La lógica vive en estado.batalla; aquí se actualiza y se refleja en el HTML.
import { estado, personajeActual } from "./estado.js";
import { ENEMIGOS } from "./data/enemigos.js";
import { sonidoClick } from "./audio.js";
import { mostrarPantalla } from "./pantallas.js";

const $ = (id) => document.getElementById(id);
const PAUSA_ENEMIGO = 1000;   // ms antes de que el enemigo actúe
let capitulo = null, espera = null;

export function iniciarCombate(cap) {
  const p = personajeActual(), e = ENEMIGOS[cap.enemigo];
  capitulo = cap;
  estado.batalla = {
    jugador: { nombre: p.nombre, color: p.color, vida: p.vida, vidaMax: p.vida, danio: p.danio, guardia: false },
    enemigo: { nombre: e.nombre, color: e.color, vida: e.vidaMax, vidaMax: e.vidaMax, danio: e.danio, tamano: e.tamano ?? 1 },
    turno: "jugador",       // "jugador" | "enemigo" | "fin"
  };
  $("resultado").hidden = true;
  mostrarPantalla("combate");
  $("j-retrato").textContent = p.nombre[0];
  $("j-retrato").style.background = p.color;
  mensaje(e.intro ?? `¡${e.nombre} aparece!`);
  refrescar();
}

function mensaje(t) { $("mensaje-combate").textContent = t; }

function pintarVida(prefijo, u) {
  const r = u.vida / u.vidaMax;
  $(prefijo + "-vida").textContent = `${u.vida}/${u.vidaMax}`;
  const barra = $(prefijo + "-barra");
  barra.style.width = r * 100 + "%";
  barra.style.background = r > .5 ? "#5cb85c" : r > .25 ? "#d9b45a" : "#d8512b";
}

function refrescar() {
  const b = estado.batalla;
  $("j-nombre").textContent = b.jugador.nombre; $("e-nombre").textContent = b.enemigo.nombre;
  pintarVida("j", b.jugador); pintarVida("e", b.enemigo);
  // Orden de turnos (arriba): el que tiene el turno se resalta
  $("orden-turnos").innerHTML = ["jugador", "enemigo"]
    .map((k) => `<span class="turno${b.turno === k ? " activo" : ""}">${b[k].nombre}</span>`).join("");
  for (const btn of document.querySelectorAll("#acciones button")) btn.disabled = b.turno !== "jugador";
}

function actuar(accion) {
  const b = estado.batalla;
  if (!b || b.turno !== "jugador") return;
  sonidoClick();
  if (accion === "huir") return salir();
  if (accion === "atacar") {
    b.enemigo.vida = Math.max(0, b.enemigo.vida - b.jugador.danio);
    mensaje(`${b.jugador.nombre} ataca e inflige ${b.jugador.danio} de daño`);
  } else if (accion === "defender") {
    b.jugador.guardia = true;
    mensaje(`${b.jugador.nombre} se pone en guardia`);
  }
  if (b.enemigo.vida <= 0) return terminar(true);
  b.turno = "enemigo"; refrescar();
  espera = setTimeout(turnoEnemigo, PAUSA_ENEMIGO);
}

function turnoEnemigo() {
  const b = estado.batalla;
  if (!b || b.turno !== "enemigo") return;
  const danio = b.jugador.guardia ? Math.ceil(b.enemigo.danio / 2) : b.enemigo.danio;
  mensaje(`${b.enemigo.nombre} ataca e inflige ${danio} de daño${b.jugador.guardia ? " (guardia)" : ""}`);
  b.jugador.guardia = false;
  b.jugador.vida = Math.max(0, b.jugador.vida - danio);
  if (b.jugador.vida <= 0) return terminar(false);
  b.turno = "jugador"; refrescar();
}

function terminar(victoria) {
  estado.batalla.turno = "fin"; refrescar();
  $("resultado-titulo").textContent = victoria ? "Victoria" : "Derrota";
  $("resultado-titulo").className = victoria ? "victoria" : "derrota";
  $("btn-reintentar").hidden = victoria;     // solo se puede reintentar tras perder
  $("resultado").hidden = false;
}

function salir() {
  clearTimeout(espera);
  estado.batalla = null;
  mostrarPantalla("menu");
}

export function prepararCombate() {
  for (const btn of document.querySelectorAll("#acciones button"))
    btn.addEventListener("click", () => actuar(btn.dataset.accion));
  $("btn-reintentar").addEventListener("click", () => { sonidoClick(); clearTimeout(espera); iniciarCombate(capitulo); });
  $("btn-salir").addEventListener("click", () => { sonidoClick(); salir(); });
}
