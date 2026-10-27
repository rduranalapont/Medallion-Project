// Lógica del menú: capítulos, ajustes y panel del personaje cargado.
import { CAPITULOS } from "./data/capitulos.js";
import { estado, personajeActual, guardarAjustes } from "./estado.js";
import { aplicarVolumenes, sonidoClick, iniciarMusica } from "./audio.js";
import { mostrarPantalla } from "./pantallas.js";
import { iniciarCombate } from "./combate.js";

const $ = (id) => document.getElementById(id);
let temporizadorAviso;

function aviso(texto) {
  const el = $("aviso"); el.textContent = texto; el.classList.add("visible");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove("visible"), 2500);
}

function mostrarPersonaje() {
  const p = personajeActual();
  $("info-personaje").innerHTML = p
    ? `<div class="nombre">${p.nombre}</div><div class="detalle">Tipo ${p.tipo} · Nivel ${p.nivel}</div>`
    : `<div class="nombre">Sin medalla</div><div class="detalle">Coloca una medalla en el lector</div>`;
  // Sin medalla, los capítulos se ven apagados (no se pueden empezar)
  for (const b of document.querySelectorAll(".capitulo")) b.classList.toggle("bloqueado", !p);
}

function iniciarCapitulo(cap) {
  if (!personajeActual()) return aviso("Inserta una medalla para empezar el capítulo");
  iniciarCombate(cap);
}

function crearCapitulos() {
  for (const cap of CAPITULOS) {
    const b = document.createElement("button");
    b.className = "capitulo";
    b.innerHTML = `<span class="num">${cap.id}</span><span class="titulo">${cap.subtitulo}</span><span class="sub">${cap.titulo}</span>`;
    b.addEventListener("click", () => { sonidoClick(); iniciarMusica(); iniciarCapitulo(cap); });
    $("lista-capitulos").append(b);
  }
}

const SLIDERS = [
  { clave: "general", texto: "General" },
  { clave: "musica", texto: "Música" },
  { clave: "efectos", texto: "Efectos" },
];

function crearAjustes() {
  for (const s of SLIDERS) {
    const fila = document.createElement("label");
    fila.className = "ajuste";
    fila.innerHTML = `<span>${s.texto}</span><input type="range" min="0" max="100" value="${estado.ajustes[s.clave]}"><output>${estado.ajustes[s.clave]}</output>`;
    const input = fila.querySelector("input"), salida = fila.querySelector("output");
    input.addEventListener("input", () => {
      estado.ajustes[s.clave] = Number(input.value);
      salida.textContent = input.value;
      aplicarVolumenes(); guardarAjustes();
    });
    input.addEventListener("change", () => { sonidoClick(); iniciarMusica(); }); // al soltar: se oye el resultado
    $("lista-sliders").append(fila);
  }
}

function cambiarPantalla(ajustes) {
  sonidoClick(); iniciarMusica();
  mostrarPantalla(ajustes ? "ajustes" : "menu");
}

// ---------- Barra superior: silencio y pantalla completa (iconos) ----------
function actualizarSilencio() {
  const b = $("btn-silencio"), mute = estado.ajustes.silenciado;
  const texto = mute ? "Activar sonido" : "Silenciar";
  b.setAttribute("aria-pressed", mute); b.setAttribute("aria-label", texto); b.title = texto;
}

const pantallaActiva = () => document.fullscreenElement || document.webkitFullscreenElement;

function actualizarPantalla() {
  const b = $("btn-pantalla"), activa = !!pantallaActiva();
  const texto = activa ? "Salir de pantalla completa" : "Pantalla completa";
  b.setAttribute("aria-pressed", activa); b.setAttribute("aria-label", texto); b.title = texto;
}

function alternarPantalla() {
  const el = document.documentElement;
  const entrar = el.requestFullscreen || el.webkitRequestFullscreen;
  const salir = document.exitFullscreen || document.webkitExitFullscreen;
  if (!entrar) return aviso("Este navegador no permite pantalla completa");
  const r = pantallaActiva() ? salir.call(document) : entrar.call(el);
  if (r && r.catch) r.catch(() => aviso("No se pudo activar la pantalla completa"));
}

function crearBarraSuperior() {
  $("btn-silencio").addEventListener("click", () => {
    estado.ajustes.silenciado = !estado.ajustes.silenciado;
    aplicarVolumenes(); guardarAjustes(); actualizarSilencio();
    sonidoClick(); iniciarMusica();
  });
  $("btn-pantalla").addEventListener("click", () => { sonidoClick(); alternarPantalla(); });
  // Se dispara también al salir con la tecla Esc
  document.addEventListener("fullscreenchange", actualizarPantalla);
  document.addEventListener("webkitfullscreenchange", actualizarPantalla);
}

export function iniciarMenu() {
  crearCapitulos(); crearAjustes(); crearBarraSuperior(); actualizarSilencio(); mostrarPersonaje();
  $("btn-ajustes").addEventListener("click", () => cambiarPantalla(true));
  $("btn-volver").addEventListener("click", () => cambiarPantalla(false));
  document.addEventListener("personaje-cambiado", mostrarPersonaje);
}
