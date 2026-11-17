// Bestiario: catálogo de personajes y enemigos descubiertos en la partida.
import { PERSONAJES } from "./data/personajes.js";
import { ENEMIGOS } from "./data/enemigos.js";
import { TIPOS } from "./data/tipos.js";
import { datos } from "./guardado.js";
import { estado } from "./estado.js";
import { mostrarPantalla } from "./pantallas.js";
import { sonidoClick } from "./audio.js";

const $ = (id) => document.getElementById(id);
let categoriaActual = "personajes";

const escapar = (valor) => String(valor ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[c]));

export function formatoTiempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = total % 60;
  if (horas) return `${horas} h ${String(minutos).padStart(2, "0")} min`;
  if (minutos) return `${minutos} min ${String(resto).padStart(2, "0")} s`;
  return `${resto} s`;
}

function imagenBestiario(entidad, descubierto, esEnemigo) {
  const src = entidad.splash ?? entidad.sprite ?? entidad.retrato ?? null;
  if (src) {
    return `<img src="${escapar(src)}" alt="${descubierto ? escapar(entidad.nombre) : "Silueta sin descubrir"}" loading="lazy">`;
  }
  // Un arte vectorial provisional permite mantener la silueta incluso si todavía no hay ilustración.
  const forma = esEnemigo
    ? "<path d=\"M50 8 60 24 78 13 75 34 94 46 79 58 86 91 65 82 50 98 35 82 14 91 21 58 6 46 25 34 22 13 40 24Z\"/><circle cx=\"50\" cy=\"48\" r=\"17\"/>"
    : "<circle cx=\"50\" cy=\"27\" r=\"17\"/><path d=\"M18 94c1-25 14-39 32-39s31 14 32 39Z\"/>";
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g>${forma}</g></svg>`;
}

function tarjeta(id, entidad, esEnemigo) {
  const descubiertos = esEnemigo ? datos.vistos.enemigos : datos.vistos.personajes;
  const descubierto = descubiertos.includes(id);
  const tipo = TIPOS[entidad.tipo]?.nombre ?? entidad.tipo ?? "Desconocido";
  const contador = esEnemigo
    ? (datos.enemigosDerrotados.porEnemigo[id] ?? 0)
    : (datos.invocaciones.porPersonaje[id] ?? 0);
  const etiquetaContador = esEnemigo ? "Derrotas" : "Invocaciones";
  const arte = imagenBestiario(entidad, descubierto, esEnemigo);
  const clase = `best-arte ${esEnemigo ? "enemigo" : "personaje"} ${descubierto ? "descubierto" : "bloqueado"}`;
  const descripcion = descubierto && entidad.descripcion
    ? `<p class="best-descripcion">${escapar(entidad.descripcion)}</p>`
    : "";

  return `<article class="tarjeta-bestiario ${descubierto ? "descubierto" : "sin-descubrir"}">
    <div class="${clase}" style="--color-entidad:${escapar(entidad.color ?? "#777")}">${arte}</div>
    <div class="best-datos">
      <h2>${escapar(entidad.nombre)}</h2>
      <p class="best-tipo">${escapar(tipo)}</p>
      <p class="best-contador"><span>${etiquetaContador}</span><strong>${contador}</strong></p>
      ${descripcion}
      ${!descubierto ? '<span class="best-pendiente">Sin descubrir</span>' : ""}
    </div>
  </article>`;
}

function actualizarTiempo() {
  $("bestiario-tiempo-valor").textContent = formatoTiempo(datos.tiempoJugado);
}

function renderizar() {
  actualizarTiempo();
  const esEnemigo = categoriaActual === "enemigos";
  const entradas = Object.entries(esEnemigo ? ENEMIGOS : PERSONAJES);
  $("lista-bestiario").innerHTML = entradas.map(([id, entidad]) => tarjeta(id, entidad, esEnemigo)).join("");
  document.querySelectorAll(".pestana-bestiario").forEach((boton) => {
    const activa = boton.dataset.categoria === categoriaActual;
    boton.classList.toggle("activa", activa);
    boton.setAttribute("aria-selected", String(activa));
  });
}

export function iniciarBestiario() {
  document.querySelectorAll(".pestana-bestiario").forEach((boton) => {
    boton.addEventListener("click", () => {
      if (categoriaActual === boton.dataset.categoria) return;
      sonidoClick(); categoriaActual = boton.dataset.categoria; renderizar();
    });
  });
  $("btn-bestiario-volver").addEventListener("click", () => {
    sonidoClick(); mostrarPantalla("principal");
  });
  document.addEventListener("pantalla", (e) => {
    if (e.detail === "bestiario") renderizar();
  });
  document.addEventListener("estadisticas-cambiadas", () => {
    if (estado.vista === "bestiario") renderizar();
  });
  document.addEventListener("partida-cargada", () => {
    if (estado.vista === "bestiario") renderizar();
  });
  setInterval(() => {
    if (estado.vista === "bestiario") actualizarTiempo();
  }, 1000);
}
