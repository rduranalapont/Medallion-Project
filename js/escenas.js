// Motor de escenas: reproduce diálogos (texto + arte + fondo) y decide cuándo se lanzan los de combate (triggers).
// El dibujo del fondo y del arte lo hace render.js leyendo estado.dialogo; aquí se maneja el texto, los botones y el teclado.
import { estado, cargarPersonaje } from "./estado.js";
import { PERSONAJES, PERSONAJE_INTRODUCTORIO } from "./data/personajes.js";
import { ENEMIGOS } from "./data/enemigos.js";
import { ESCENAS } from "./data/escenas.js";
import { mostrarPantalla } from "./pantallas.js";
import { sonidoClick } from "./audio.js";

const $ = (id) => document.getElementById(id);
const MS_POR_LETRA = 26;                       // velocidad de la máquina de escribir
const SIN_ANIMACION = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Acciones que puede lanzar un botón de elección dentro de una escena (línea con "boton: { texto, accion }")
const ACCIONES = {
  reclutarIntroductorio: () => cargarPersonaje(PERSONAJE_INTRODUCTORIO),   // "introducir el NFC vacío": carga a Mayu
};

let contexto = {}, alTerminar = null, temporizador = null, escribiendo = false, textoCompleto = "";

// ---------- Reproducción ----------
export function reproducirEscena(id, ctx, fin) {
  const def = ESCENAS[id];
  if (!def || !def.lineas?.length) return fin?.();            // escena inexistente: se salta sin romper nada
  contexto = ctx ?? {}; alTerminar = fin;
  estado.dialogo = { def, i: 0, fondo: def.fondo ?? null, actual: null, tInicio: performance.now(), t0: performance.now() };
  mostrarPantalla("escena");
  mostrarLinea(0);
}

export function reproducirEscenas(ids, ctx, fin) {            // varias escenas seguidas
  if (!ids.length) return fin();
  reproducirEscena(ids[0], ctx, () => reproducirEscenas(ids.slice(1), ctx, fin));
}

// Quién habla en una línea: nombre, arte y encuadre
function resolverHablante(l) {
  let nombre = l.hablante ?? "", imagen = l.imagen ?? null, anclaX = l.anclaX ?? 0.5, encuadre = l.encuadre ?? {};
  let lado = l.lado ?? "derecha";                              // el jugador a la derecha...
  if (l.personaje === "enemigo") {
    const e = ENEMIGOS[contexto.enemigo] ?? {};
    nombre ||= e.nombre ?? ""; imagen ??= e.splash ?? null; anclaX = l.anclaX ?? e.anclaX ?? anclaX; encuadre = l.encuadre ?? e.encuadre ?? encuadre;
    lado = l.lado ?? "izquierda";                              // ...y el enemigo a la izquierda (así no tapan su propio sprite)
  } else if (l.personaje) {
    const p = PERSONAJES[l.personaje === "jugador" ? estado.ID_personaje : l.personaje];
    if (p) { nombre ||= p.nombre; imagen ??= p.splash ?? null; anclaX = l.anclaX ?? p.anclaX ?? anclaX; encuadre = l.encuadre ?? p.encuadre ?? encuadre; }
  }
  return { nombre, imagen, anclaX, encuadre, lado };
}

function mostrarLinea(i) {
  const d = estado.dialogo, l = d.def.lineas[i];
  d.i = i;
  if (l.fondo) d.fondo = l.fondo;                              // el fondo se mantiene hasta que otra línea lo cambie
  const previo = d.actual, nuevo = { ...resolverHablante(l), fondo: d.fondo };
  if (!previo || previo.imagen !== nuevo.imagen || previo.lado !== nuevo.lado) d.t0 = performance.now();   // reinicia la animación de entrada del arte
  d.actual = nuevo;
  const boton = $("esc-boton"); boton.hidden = !l.boton; if (l.boton) boton.textContent = l.boton.texto;
  const etiqueta = $("esc-etiqueta");
  etiqueta.textContent = d.actual.nombre; etiqueta.hidden = !d.actual.nombre;
  $("esc-marco").dataset.lado = d.actual.lado;
  $("esc-prev").disabled = i === 0;
  escribir(l.texto);
}

function escribir(texto) {
  clearInterval(temporizador);
  const caja = $("esc-texto");
  textoCompleto = texto;
  if (SIN_ANIMACION) { caja.textContent = texto; escribiendo = false; return; }
  let n = 0; escribiendo = true; caja.textContent = "";
  temporizador = setInterval(() => {
    caja.textContent = texto.slice(0, ++n);
    if (n >= texto.length) { clearInterval(temporizador); escribiendo = false; }
  }, MS_POR_LETRA);
}

function avanzar() {
  const d = estado.dialogo; if (!d) return;
  sonidoClick();
  if (escribiendo) { clearInterval(temporizador); $("esc-texto").textContent = textoCompleto; escribiendo = false; return; }
  const actual = d.def.lineas[d.i];
  if (actual.boton) ACCIONES[actual.boton.accion]?.();           // línea con botón: avanzar = pulsarlo
  if (d.i < d.def.lineas.length - 1) return mostrarLinea(d.i + 1);
  clearInterval(temporizador);                                 // última línea: termina la escena
  estado.dialogo = null;
  const fin = alTerminar; alTerminar = null;
  fin?.();
}

function retroceder() {
  const d = estado.dialogo;
  if (d && d.i > 0) { sonidoClick(); mostrarLinea(d.i - 1); }
}

export function prepararEscenas() {
  $("esc-sig").addEventListener("click", avanzar);
  $("esc-prev").addEventListener("click", retroceder);
  $("esc-caja").addEventListener("click", avanzar);
  $("esc-boton").addEventListener("click", avanzar);
  document.addEventListener("keydown", (e) => {
    if (!estado.dialogo) return;
    if (["ArrowRight", " ", "Enter"].includes(e.key)) { e.preventDefault(); avanzar(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); retroceder(); }
  });
}

// ---------- Triggers de combate ----------
// Para añadir un tipo de condición nuevo, añade una función aquí y úsala en "cuando" (capitulos.js)
const CONDICIONES = {
  inicio:      (b, v, momento) => momento === "inicio",
  ronda:       (b, v) => b.ronda >= v,
  enemigoVida: (b, v) => b.enemigo.vida / b.enemigo.vidaMax <= v,
  jugadorVida: (b, v) => b.jugador.vida / b.jugador.vidaMax <= v,
};

// Devuelve los ids de escena que se deben lanzar ahora (cada trigger solo se dispara una vez por pelea)
export function triggersPendientes(b, cap, momento) {
  b.disparados ??= new Set();
  const lanzar = [];
  (cap?.dialogos ?? []).forEach((t, i) => {
    if (b.disparados.has(i)) return;
    if (Object.entries(t.cuando).every(([clave, valor]) => CONDICIONES[clave]?.(b, valor, momento))) {
      b.disparados.add(i); lanzar.push(t.escena);
    }
  });
  return lanzar;
}
