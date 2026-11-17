// Pelea 1 contra 1 por turnos. Las reglas están en reglas.js; aquí se enlazan con el HTML.
import { estado, personajeActual } from "./estado.js";
import { ENEMIGOS } from "./data/enemigos.js";
import { TIPOS, ACCIONES } from "./data/tipos.js";
import { crearBatalla, ejecutarAccion, accionSecundaria } from "./reglas.js";
import { sonidoClick } from "./audio.js";
import { mostrarPantalla } from "./pantallas.js";
import { registrarVisto, registrarDerrota, registrarMuerte, completarCapitulo, registrarRecordInfinito, datos } from "./guardado.js";
import { reproducirEscena, reproducirEscenas, triggersPendientes } from "./escenas.js";

const $ = (id) => document.getElementById(id);
const PAUSA_ENEMIGO = 1000;
const PAUSA_OLEADA = 900;
let capitulo = null, espera = null, rachaInfinita = null;

const contexto = () => ({ enemigo: capitulo?.enemigo });

// ---------- Capítulos normales y modo infinito ----------
export function iniciarCapitulo(cap) {
  clearTimeout(espera);
  if (cap.modo === "infinito") return iniciarModoInfinito(cap);
  rachaInfinita = null;
  capitulo = cap;
  if (cap.escenaInicio) reproducirEscena(cap.escenaInicio, contexto(), () => iniciarCombate(cap));
  else iniciarCombate(cap);
}

export function iniciarCombate(cap) {
  clearTimeout(espera);
  rachaInfinita = null;
  capitulo = cap;
  const p = personajeActual(), e = ENEMIGOS[cap.enemigo];
  estado.batalla = crearBatalla(p, e);
  $("resultado").hidden = true;
  $("resultado-detalle").textContent = "";
  $("racha-hud").hidden = true;
  $("btn-reintentar").textContent = "Reintentar";
  $("btn-salir").textContent = "Volver al menú";
  registrarVisto("personajes", p.id); registrarVisto("enemigos", e.id);
  estado.batalla.t0 = performance.now();
  mostrarPantalla("combate");
  prepararRetrato(p);
  mensaje(e.intro ?? `¡${e.nombre} aparece!`);
  refrescar();
  reproducirEscenas(triggersPendientes(estado.batalla, cap, "inicio"), contexto(), volverAlCombate);
}

function prepararRetrato(p) {
  const retrato = $("j-retrato");
  retrato.textContent = p.retrato ? "" : p.nombre[0];
  retrato.style.background = p.retrato ? `url("${p.retrato}") center / cover` : p.color;
}

function mezclarEnemigos(ids) {
  const bolsa = [...ids];
  for (let i = bolsa.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]];
  }
  return bolsa;
}

function siguienteEnemigoInfinito() {
  if (!rachaInfinita.bolsa.length) rachaInfinita.bolsa = mezclarEnemigos(Object.keys(ENEMIGOS));
  // Evita repetir el mismo enemigo dos veces seguidas cuando hay alternativas disponibles.
  if (rachaInfinita.bolsa.length > 1 && rachaInfinita.bolsa[rachaInfinita.bolsa.length - 1] === rachaInfinita.ultimoEnemigo) {
    const ultimo = rachaInfinita.bolsa.length - 1;
    [rachaInfinita.bolsa[ultimo], rachaInfinita.bolsa[ultimo - 1]] = [rachaInfinita.bolsa[ultimo - 1], rachaInfinita.bolsa[ultimo]];
  }
  const id = rachaInfinita.bolsa.pop();
  rachaInfinita.ultimoEnemigo = id;
  return id;
}

function iniciarModoInfinito(cap) {
  clearTimeout(espera);
  rachaInfinita = { capituloBase: cap, derrotados: 0, ultimoEnemigo: null, bolsa: [] };
  iniciarOleada(null);
}

function iniciarOleada(vidaJugador) {
  if (!rachaInfinita) return;
  clearTimeout(espera);
  const idEnemigo = siguienteEnemigoInfinito();
  capitulo = { ...rachaInfinita.capituloBase, enemigo: idEnemigo };
  const p = personajeActual(), e = ENEMIGOS[idEnemigo];
  estado.batalla = crearBatalla(p, e);
  if (vidaJugador !== null) estado.batalla.jugador.vida = Math.max(1, Math.min(vidaJugador, estado.batalla.jugador.vidaMax));
  estado.batalla.t0 = performance.now();
  $("resultado").hidden = true;
  $("racha-hud").hidden = false;
  registrarVisto("personajes", p.id); registrarVisto("enemigos", e.id);
  prepararRetrato(p);
  mensaje(rachaInfinita.derrotados
    ? `¡${e.nombre} se interpone! Enemigos vencidos: ${rachaInfinita.derrotados}`
    : (e.intro ?? `¡${e.nombre} aparece!`));
  actualizarRachaHud();
  refrescar();
  mostrarPantalla("combate");
}

function actualizarRachaHud() {
  const hud = $("racha-hud");
  if (!rachaInfinita) { hud.hidden = true; return; }
  hud.hidden = false;
  $("racha-actual").textContent = rachaInfinita.derrotados;
  $("racha-record").textContent = datos.modoInfinito?.record ?? 0;
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
  if (!b) return;
  $("j-nombre").textContent = `${b.jugador.nombre} · ${TIPOS[b.jugador.tipo].nombre}`;
  $("e-nombre").textContent = `${b.enemigo.nombre} · ${TIPOS[b.enemigo.tipo].nombre}`;
  pintarVida("j", b.jugador); pintarVida("e", b.enemigo);
  $("orden-turnos").innerHTML = ["jugador", "enemigo"].map((k) => {
    const activo = b.turno === k;
    return `<span class="turno${activo ? " activo" : ""}">${b[k].nombre}${activo && b.restantes > 1 ? ` ×${b.restantes}` : ""}</span>`;
  }).join("");
  const secundaria = accionSecundaria(b.jugador);
  for (const btn of document.querySelectorAll("#acciones button")) {
    if (btn.id === "btn-secundaria") btn.dataset.accion = secundaria;
    const accion = btn.dataset.accion;
    const a = ACCIONES[accion];
    btn.textContent = accion === "huir" && rachaInfinita ? "Terminar racha" : a.nombre;
    btn.title = accion === "huir" && rachaInfinita ? "Finaliza la racha actual sin registrar una muerte" : a.info;
    btn.disabled = b.turno !== "jugador";
  }
  actualizarRachaHud();
}

function actuar(accion) {
  const b = estado.batalla;
  if (!b || b.turno !== "jugador") return;
  sonidoClick();
  if (accion === "huir") return rachaInfinita ? finalizarRacha(false) : salir();
  mensaje(ejecutarAccion(b, "jugador", accion));
  siguiente();
}

function turnoEnemigo() {
  const b = estado.batalla;
  if (!b || b.turno !== "enemigo") return;
  mensaje(ejecutarAccion(b, "enemigo", "atacar"));
  siguiente();
}

function siguiente() {
  const b = estado.batalla;
  refrescar();
  const continuar = () => {
    if (!estado.batalla) return;
    volverAlCombate();
    if (b.turno === "fin") return terminar(b.ganador === "jugador");
    if (b.turno === "enemigo") espera = setTimeout(turnoEnemigo, PAUSA_ENEMIGO);
  };
  const escenas = b.turno === "fin" ? [] : triggersPendientes(b, capitulo, "accion");
  reproducirEscenas(escenas, contexto(), continuar);
}

function terminar(victoria) {
  if (rachaInfinita) {
    if (victoria) {
      registrarDerrota(capitulo.enemigo);
      rachaInfinita.derrotados++;
      registrarRecordInfinito(rachaInfinita.derrotados);
      actualizarRachaHud();
      mensaje(`¡Enemigo derrotado! Llevas ${rachaInfinita.derrotados}. El siguiente se acerca...`);
      const vidaRestante = estado.batalla.jugador.vida;
      espera = setTimeout(() => iniciarOleada(vidaRestante), PAUSA_OLEADA);
    } else {
      registrarMuerte();
      finalizarRacha(true);
    }
    return;
  }
  if (victoria) { registrarDerrota(capitulo.enemigo); completarCapitulo(capitulo.id); } else registrarMuerte();
  if (victoria && capitulo?.escenaFinal) return reproducirEscena(capitulo.escenaFinal, contexto(), () => { volverAlCombate(); mostrarResultado(true); });
  mostrarResultado(victoria);
}

function finalizarRacha(derrotado) {
  if (!rachaInfinita) return;
  clearTimeout(espera);
  if (estado.batalla) estado.batalla.turno = "fin";
  $("racha-hud").hidden = true;
  $("resultado-titulo").textContent = derrotado ? "Racha terminada" : "Racha finalizada";
  $("resultado-titulo").className = derrotado ? "derrota" : "victoria";
  const record = datos.modoInfinito?.record ?? 0;
  $("resultado-detalle").textContent = `Has vencido ${rachaInfinita.derrotados} enemigos. Récord máximo: ${record}.`;
  $("btn-reintentar").hidden = false;
  $("btn-reintentar").textContent = "Nueva racha";
  $("btn-salir").textContent = "Volver a capítulos";
  $("resultado").hidden = false;
  document.querySelectorAll("#acciones button").forEach((b) => { b.disabled = true; });
}

function mostrarResultado(victoria) {
  $("resultado-titulo").textContent = victoria ? "Victoria" : "Derrota";
  $("resultado-titulo").className = victoria ? "victoria" : "derrota";
  $("resultado-detalle").textContent = "";
  $("btn-reintentar").hidden = victoria;
  $("btn-reintentar").textContent = "Reintentar";
  $("btn-salir").textContent = "Volver al menú";
  $("resultado").hidden = false;
}

function salir() {
  clearTimeout(espera);
  estado.batalla = null;
  rachaInfinita = null;
  $("racha-hud").hidden = true;
  mostrarPantalla("capitulos");
}

export function prepararCombate() {
  for (const btn of document.querySelectorAll("#acciones button"))
    btn.addEventListener("click", () => actuar(btn.dataset.accion));
  $("btn-reintentar").addEventListener("click", () => {
    sonidoClick(); clearTimeout(espera);
    if (rachaInfinita) iniciarModoInfinito(rachaInfinita.capituloBase);
    else iniciarCombate(capitulo);
  });
  $("btn-salir").addEventListener("click", () => { sonidoClick(); salir(); });
}
