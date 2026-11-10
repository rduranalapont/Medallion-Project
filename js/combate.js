// Pelea 1 contra 1 por turnos. Las reglas están en reglas.js; aquí se enlazan con el HTML.
import { estado, personajeActual } from "./estado.js";
import { ENEMIGOS } from "./data/enemigos.js";
import { TIPOS, ACCIONES } from "./data/tipos.js";
import { crearBatalla, ejecutarAccion, accionSecundaria } from "./reglas.js";
import { sonidoClick } from "./audio.js";
import { mostrarPantalla } from "./pantallas.js";

const $ = (id) => document.getElementById(id);
const PAUSA_ENEMIGO = 1000;   // ms entre cada acción del enemigo
let capitulo = null, espera = null;

export function iniciarCombate(cap) {
  const p = personajeActual(), e = ENEMIGOS[cap.enemigo];
  capitulo = cap;
  estado.batalla = crearBatalla(p, e);
  $("resultado").hidden = true;
  mostrarPantalla("combate");
  const retrato = $("j-retrato");                       // con imagen: la cara; sin imagen: inicial sobre el color
  retrato.textContent = p.retrato ? "" : p.nombre[0];
  retrato.style.background = p.retrato ? `url("${p.retrato}") center / cover` : p.color;
  mensaje(e.intro ?? `¡${e.nombre} aparece!`);
  refrescar();
}

function mensaje(t) { if (t) $("mensaje-combate").textContent = t; }

function pintarVida(prefijo, u) {
  const r = u.vida / u.vidaMax;
  $(prefijo + "-vida").textContent = `${u.vida}/${u.vidaMax}`;
  const barra = $(prefijo + "-barra");
  barra.style.width = r * 100 + "%";
  barra.style.background = r > .5 ? "#5cb85c" : r > .25 ? "#d9b45a" : "#d8512b";
}

function refrescar() {
  const b = estado.batalla;
  $("j-nombre").textContent = `${b.jugador.nombre} · ${TIPOS[b.jugador.tipo].nombre}`;
  $("e-nombre").textContent = `${b.enemigo.nombre} · ${TIPOS[b.enemigo.tipo].nombre}`;
  pintarVida("j", b.jugador); pintarVida("e", b.enemigo);
  // Orden de turnos: el que tiene el turno se resalta y muestra cuántas acciones le quedan (×2)
  $("orden-turnos").innerHTML = ["jugador", "enemigo"].map((k) => {
    const activo = b.turno === k;
    return `<span class="turno${activo ? " activo" : ""}">${b[k].nombre}${activo && b.restantes > 1 ? ` ×${b.restantes}` : ""}</span>`;
  }).join("");
  // El segundo botón cambia según el tipo (Defender / Rush / Negar)
  const secundaria = accionSecundaria(b.jugador);
  for (const btn of document.querySelectorAll("#acciones button")) {
    if (btn.id === "btn-secundaria") btn.dataset.accion = secundaria;
    const a = ACCIONES[btn.dataset.accion];
    btn.textContent = a.nombre; btn.title = a.info;
    btn.disabled = b.turno !== "jugador";
  }
}

function actuar(accion) {
  const b = estado.batalla;
  if (!b || b.turno !== "jugador") return;
  sonidoClick();
  if (accion === "huir") return salir();
  mensaje(ejecutarAccion(b, "jugador", accion));
  siguiente();
}

function turnoEnemigo() {
  const b = estado.batalla;
  if (!b || b.turno !== "enemigo") return;
  mensaje(ejecutarAccion(b, "enemigo", "atacar"));   // por ahora el enemigo solo ataca
  siguiente();
}

// Tras cada acción: refresca y decide si sigue tu turno, toca al enemigo o termina la pelea
function siguiente() {
  const b = estado.batalla;
  refrescar();
  if (b.turno === "fin") return terminar(b.ganador === "jugador");
  if (b.turno === "enemigo") espera = setTimeout(turnoEnemigo, PAUSA_ENEMIGO);
}

function terminar(victoria) {
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
