// Pelea 1 contra 1 por turnos. Las reglas están en reglas.js; aquí se enlazan con el HTML.
import { estado, personajeActual } from "./estado.js";
import { ENEMIGOS } from "./data/enemigos.js";
import { TIPOS, ACCIONES } from "./data/tipos.js";
import { crearBatalla, ejecutarAccion, accionSecundaria } from "./reglas.js";
import { sonidoClick } from "./audio.js";
import { mostrarPantalla } from "./pantallas.js";
import { registrarVisto, registrarDerrota, registrarMuerte, completarCapitulo } from "./guardado.js";
import { reproducirEscena, reproducirEscenas, triggersPendientes } from "./escenas.js";

const $ = (id) => document.getElementById(id);
const PAUSA_ENEMIGO = 1000;   // ms entre cada acción del enemigo
let capitulo = null, espera = null;

const contexto = () => ({ enemigo: capitulo?.enemigo });   // lo que necesitan las escenas ("enemigo" = el de este capítulo)

// Entrada de un capítulo: primero su escena inicial (si tiene) y después la pelea
export function iniciarCapitulo(cap) {
  capitulo = cap;
  if (cap.escenaInicio) reproducirEscena(cap.escenaInicio, contexto(), () => iniciarCombate(cap));
  else iniciarCombate(cap);
}

export function iniciarCombate(cap) {
  const p = personajeActual(), e = ENEMIGOS[cap.enemigo];
  capitulo = cap;
  estado.batalla = crearBatalla(p, e);
  $("resultado").hidden = true;
  registrarVisto("personajes", p.id); registrarVisto("enemigos", e.id);     // se desbloquean en el bestiario
  estado.batalla.t0 = performance.now();                                    // para la animación de entrada de los luchadores
  mostrarPantalla("combate");
  const retrato = $("j-retrato");                       // con imagen: la cara; sin imagen: inicial sobre el color
  retrato.textContent = p.retrato ? "" : p.nombre[0];
  retrato.style.background = p.retrato ? `url("${p.retrato}") center / cover` : p.color;
  mensaje(e.intro ?? `¡${e.nombre} aparece!`);
  refrescar();
  reproducirEscenas(triggersPendientes(estado.batalla, cap, "inicio"), contexto(), volverAlCombate);   // diálogos de "inicio"
}

function volverAlCombate() {
  if (!estado.batalla) return;
  mostrarPantalla("combate"); refrescar();
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
  const continuar = () => {                                   // se ejecuta cuando terminan los diálogos (o enseguida si no hay)
    if (!estado.batalla) return;
    volverAlCombate();
    if (b.turno === "fin") return terminar(b.ganador === "jugador");
    if (b.turno === "enemigo") espera = setTimeout(turnoEnemigo, PAUSA_ENEMIGO);
  };
  const escenas = b.turno === "fin" ? [] : triggersPendientes(b, capitulo, "accion");
  reproducirEscenas(escenas, contexto(), continuar);          // el combate queda en pausa mientras suena el diálogo
}

function terminar(victoria) {
  if (victoria) { registrarDerrota(capitulo.enemigo); completarCapitulo(capitulo.id); } else registrarMuerte();
  // Si ganas y el capítulo tiene escena final, se reproduce antes de mostrar "Victoria"
  if (victoria && capitulo?.escenaFinal) return reproducirEscena(capitulo.escenaFinal, contexto(), () => { volverAlCombate(); mostrarResultado(true); });
  mostrarResultado(victoria);
}

function mostrarResultado(victoria) {
  $("resultado-titulo").textContent = victoria ? "Victoria" : "Derrota";
  $("resultado-titulo").className = victoria ? "victoria" : "derrota";
  $("btn-reintentar").hidden = victoria;     // solo se puede reintentar tras perder
  $("resultado").hidden = false;
}

function salir() {
  clearTimeout(espera);
  estado.batalla = null;
  mostrarPantalla("capitulos");
}

export function prepararCombate() {
  for (const btn of document.querySelectorAll("#acciones button"))
    btn.addEventListener("click", () => actuar(btn.dataset.accion));
  $("btn-reintentar").addEventListener("click", () => { sonidoClick(); clearTimeout(espera); iniciarCombate(capitulo); });
  $("btn-salir").addEventListener("click", () => { sonidoClick(); salir(); });
}
