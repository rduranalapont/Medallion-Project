// Lógica de los menús: título, menú principal, capítulos, ajustes y barra superior.
import { CAPITULOS } from "./data/capitulos.js";
import { PERSONAJES } from "./data/personajes.js";
import { TIPOS } from "./data/tipos.js";
import { estado, personajeActual, guardarAjustes } from "./estado.js";
import { datos, recargadaPorGuardado, guardarAhora, elegirArchivo, cargarArchivo, cargarDesdeTexto, reconectar, estadoArchivo, soportaArchivo, borrarPartida, marcarIntroVista } from "./guardado.js";
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
    reconectar();                                             // si hay archivo de guardado, pide permiso (necesita un clic)
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

  // Partida guardada: archivo .txt vinculado (se elige una vez y después se escribe solo)
  $("btn-elegir").addEventListener("click", async () => {
    sonidoClick();
    if (!soportaArchivo) return aviso("Este navegador no permite elegir archivo: usa el disquete para descargar una copia");
    if (await elegirArchivo()) aviso("Archivo vinculado: la partida se guardará sola ahí");
  });
  $("btn-importar").addEventListener("click", async () => {
    sonidoClick();
    if (!soportaArchivo) return $("archivo-partida").click();
    const r = await cargarArchivo();
    if (r === "ok") aviso("Partida cargada y archivo vinculado"); else if (r === "invalido") aviso("Ese archivo no es una partida válida");
  });
  $("archivo-partida").addEventListener("change", async (e) => {       // solo en navegadores sin acceso a archivos
    const f = e.target.files[0]; e.target.value = "";
    if (f) aviso(await cargarDesdeTexto(f) ? "Partida cargada" : "Ese archivo no es una partida válida");
  });
  $("btn-borrar").addEventListener("click", () => {
    sonidoClick();
    if (confirm("¿Borrar todos los datos de la partida? (tiempo, invocaciones, capítulos completados, introducción...)")) {
      borrarPartida(); aviso("Datos borrados");
    }
  });
  document.addEventListener("archivo-cambiado", actualizarEstadoArchivo);
  actualizarEstadoArchivo();
}

// Texto de estado en Ajustes y punto de color en el disquete (verde = archivo listo, ámbar = pide permiso)
function actualizarEstadoArchivo() {
  const { nombre, permiso } = estadoArchivo();
  $("btn-guardar").dataset.estado = permiso;
  $("estado-archivo").textContent = !soportaArchivo
    ? "Este navegador no puede vincular un archivo: el disquete descarga una copia .txt (y la partida se guarda sola en el navegador)."
    : permiso === "pausado" ? "Guardado en archivo EN PAUSA: guardar ahí recarga la página (pasa con Live Server cuando el archivo está dentro de la carpeta del proyecto). Pulsa «Elegir archivo» y guárdalo fuera de la carpeta, por ejemplo en Documentos. Mientras tanto la partida se guarda en el navegador."
    : permiso === "listo" ? `Archivo vinculado: ${nombre}. Se guarda solo cuando pasa algo importante. Con Live Server, mantenlo fuera de la carpeta del proyecto.`
    : permiso === "pendiente" ? `Archivo vinculado: ${nombre}. Pulsa el disquete para dar permiso otra vez.`
    : "Sin archivo vinculado: se guarda en el navegador. Pulsa el disquete para elegir dónde guardarlo (solo una vez). Con Live Server, elige un sitio fuera de la carpeta del proyecto.";
}

// Disquete: guardar ahora
function crearDisquete() {
  const boton = $("btn-guardar");
  boton.addEventListener("click", async () => {
    sonidoClick();
    const donde = await guardarAhora();
    boton.classList.remove("ok"); void boton.offsetWidth; boton.classList.add("ok");              // destello
    aviso(donde === "archivo" ? `Partida guardada en ${estadoArchivo().nombre}`
        : donde === "pausado" ? "Guardado en archivo en pausa (recarga continua detectada): mira Ajustes"
        : donde === "descarga" ? "Copia de la partida descargada (.txt)"
        : "Partida guardada en el navegador");
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
  crearTitulo(); crearPrincipal(); crearCapitulos(); crearAjustes(); crearDisquete(); crearBarraSuperior();
  actualizarSilencio(); mostrarPersonaje();
  document.addEventListener("personaje-cambiado", mostrarPersonaje);
  document.addEventListener("pantalla", (e) => { if (e.detail === "capitulos") actualizarCapitulos(); });   // al volver: ✓ en los completados
  document.addEventListener("partida-cargada", () => {        // tras importar o borrar: se recupera la medalla guardada
    estado.ID_personaje = PERSONAJES[datos.ultimoPersonaje] ? datos.ultimoPersonaje : null;
    mostrarPersonaje();
  });
  // Si la página se recargó por culpa de un guardado, se vuelve a la pantalla en la que estabas (no al título)
  const vista = sessionStorage.getItem("medallion_vista");
  if (recargadaPorGuardado) {
    mostrarPantalla(["principal", "capitulos", "ajustes"].includes(vista) ? vista : "capitulos");
    document.addEventListener("pointerdown", () => { iniciarMusica(); reconectar(); }, { once: true });   // el audio necesita un clic
    setTimeout(() => aviso("Guardar en ese archivo recarga la página (Live Server). Se ha pausado: elige otra ubicación con el disquete"), 900);
  } else mostrarPantalla("inicio");
}
