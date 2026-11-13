// Lógica de los menús: título, menú principal, capítulos, ajustes y barra superior.
import { CAPITULOS } from "./data/capitulos.js";
import { PERSONAJES } from "./data/personajes.js";
import { TIPOS } from "./data/tipos.js";
import { estado, personajeActual, guardarAjustes } from "./estado.js";
import { datos, exportarTxt, importarTxt, borrarPartida, marcarIntroVista } from "./guardado.js";
import { aplicarVolumenes, sonidoClick, iniciarMusica } from "./audio.js";
import { mostrarPantalla } from "./pantallas.js";
import { reproducirEscena } from "./escenas.js";
import { iniciarCapitulo as empezarCapitulo } from "./combate.js";

const $ = (id) => document.getElementById(id);
let temporizadorAviso;

export function aviso(texto) {
  const el = $("aviso"); el.textContent = texto; el.classList.add("visible");
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => el.classList.remove("visible"), 2800);
}

// ---------- Pantalla de título ----------
function crearTitulo() {
  const empezar = () => {
    if (estado.vista !== "inicio") return;
    sonidoClick(); iniciarMusica();                           // el audio solo puede arrancar tras un clic o tecla
    mostrarPantalla("principal");
  };
  $("pantalla-inicio").addEventListener("click", empezar);
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.startsWith("F") && e.key.length > 1 || e.key === "Tab") return;
    empezar();
  });
}

// ---------- Menú principal ----------
function crearPrincipal() {
  $("op-capitulos").addEventListener("click", () => {
    sonidoClick();
    if (!datos.introVista) iniciarIntro(); else mostrarPantalla("capitulos");   // la primera vez: cinemática
  });
  $("op-bestiario").addEventListener("click", () => { sonidoClick(); aviso("Bestiario: próximamente"); });
  $("op-ajustes").addEventListener("click", () => { sonidoClick(); mostrarPantalla("ajustes"); });
}

// La introducción: cinemática + "NFC vacío" que recluta al personaje introductorio. Se puede repetir desde Capítulos.
function iniciarIntro() {
  reproducirEscena("intro_mundo", {}, () => { marcarIntroVista(); mostrarPantalla("capitulos"); });
}

// ---------- Capítulos ----------
function mostrarPersonaje() {
  const p = personajeActual();
  $("info-personaje").innerHTML = p
    ? `<div class="nombre">${p.nombre}</div><div class="detalle">${TIPOS[p.tipo].nombre} · Nivel ${p.nivel}</div>`
    : `<div class="nombre">Sin medalla</div><div class="detalle">Coloca una medalla en el lector</div>`;
  actualizarCapitulos();
}

function actualizarCapitulos() {                              // apagados sin medalla, con ✓ si ya se completaron
  const p = personajeActual();
  document.querySelectorAll(".capitulo").forEach((b, i) => {
    b.classList.toggle("bloqueado", !p);
    b.classList.toggle("completado", datos.capitulosCompletados.includes(CAPITULOS[i].id));
  });
}

function iniciarCapitulo(cap) {
  if (!personajeActual()) return aviso("Inserta una medalla para empezar (o repite la Introducción)");
  empezarCapitulo(cap);
}

function crearCapitulos() {
  CAPITULOS.forEach((cap, i) => {
    const b = document.createElement("button");
    b.className = "capitulo item"; b.style.setProperty("--i", i);
    b.innerHTML = `<span class="num">${cap.id}</span><span class="titulo">${cap.subtitulo}</span><span class="sub">${cap.titulo}</span><span class="marca">✓ Completado</span>`;
    b.addEventListener("click", () => { sonidoClick(); iniciarCapitulo(cap); });
    $("lista-capitulos").append(b);
  });
  $("btn-volver-principal").addEventListener("click", () => { sonidoClick(); mostrarPantalla("principal"); });
  $("btn-intro").addEventListener("click", () => { sonidoClick(); iniciarIntro(); });
}

// ---------- Ajustes ----------
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
    input.addEventListener("change", () => { sonidoClick(); iniciarMusica(); });   // al soltar: se oye el resultado
    $("lista-sliders").append(fila);
  }
  $("btn-volver").addEventListener("click", () => { sonidoClick(); mostrarPantalla("principal"); });

  // Partida guardada (.txt)
  $("btn-exportar").addEventListener("click", () => { sonidoClick(); exportarTxt(); aviso("Partida guardada en medalion_partida.txt"); });
  $("btn-importar").addEventListener("click", () => { sonidoClick(); $("archivo-partida").click(); });
  $("archivo-partida").addEventListener("change", async (e) => {
    const archivo = e.target.files[0]; e.target.value = "";
    if (!archivo) return;
    aviso(await importarTxt(archivo) ? "Partida cargada" : "Ese archivo no es una partida válida");
  });
  $("btn-borrar").addEventListener("click", () => {
    sonidoClick();
    if (confirm("¿Borrar todos los datos de la partida? (tiempo, invocaciones, capítulos completados, introducción...)")) {
      borrarPartida(); aviso("Datos borrados");
    }
  });
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
  document.addEventListener("fullscreenchange", actualizarPantalla);          // también al salir con Esc
  document.addEventListener("webkitfullscreenchange", actualizarPantalla);
}

export function iniciarMenu() {
  crearTitulo(); crearPrincipal(); crearCapitulos(); crearAjustes(); crearBarraSuperior();
  actualizarSilencio(); mostrarPersonaje();
  document.addEventListener("personaje-cambiado", mostrarPersonaje);
  document.addEventListener("pantalla", (e) => { if (e.detail === "capitulos") actualizarCapitulos(); });   // al volver: ✓ en los completados
  document.addEventListener("partida-cargada", () => {        // tras importar o borrar: se recupera la medalla guardada
    estado.ID_personaje = PERSONAJES[datos.ultimoPersonaje] ? datos.ultimoPersonaje : null;
    mostrarPersonaje();
  });
  mostrarPantalla("inicio");
}
