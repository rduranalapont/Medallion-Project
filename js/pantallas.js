// Cambia entre pantallas con animación. Pantallas: inicio, principal, capitulos, ajustes, combate, escena.
// Para añadir una nueva: crea su <section id="pantalla-xxx" class="pantalla" hidden>, añádela a NOMBRES (y a FONDO_DE si cambia el fondo del canvas).
import { estado } from "./estado.js";

const NOMBRES = ["inicio", "principal", "capitulos", "ajustes", "combate", "escena"];
const FONDO_DE = { inicio: "titulo", principal: "titulo", ajustes: "titulo", capitulos: "menu", combate: "combate" };  // qué dibuja el canvas detrás ("escena" no lo cambia)
const CON_VELO = new Set(["inicio", "combate", "escena"]);   // en estos cambios la pantalla pasa por un fundido a negro
const CON_GUARDADO = new Set(["principal", "capitulos", "ajustes"]);   // menús donde se ve el disquete (no en el título)
const MS_SALIDA = 180;
const $ = (id) => document.getElementById(id);
let destino = null, ocupado = false;

// Muestra la pantalla de golpe (la animación de entrada la hace el CSS con la clase "entra")
function aplicar(nombre) {
  for (const n of NOMBRES) $("pantalla-" + n).hidden = n !== nombre;
  estado.vista = nombre;
  try { sessionStorage.setItem("medallion_vista", nombre); } catch (e) {}   // para volver aquí si la página se recarga
  if (FONDO_DE[nombre]) estado.escena = FONDO_DE[nombre];
  $("info-personaje").hidden = nombre !== "capitulos";      // la medalla invocada solo se muestra en Capítulos
  $("btn-guardar").hidden = !CON_GUARDADO.has(nombre);
  for (const el of [$("pantalla-" + nombre), nombre === "capitulos" ? $("info-personaje") : null]) {
    if (!el) continue;
    el.classList.remove("sale", "entra"); void el.offsetWidth; el.classList.add("entra");   // reinicia la animación
  }
  document.dispatchEvent(new CustomEvent("pantalla", { detail: nombre }));
}

export function mostrarPantalla(nombre) {
  destino = nombre;
  if (ocupado || nombre === estado.vista) return;
  if (!estado.vista) return aplicar(nombre);                  // primera pantalla: sin salida
  ocupado = true;
  $("pantalla-" + estado.vista).classList.add("sale");        // 1) la pantalla actual sale...
  const velo = CON_VELO.has(estado.vista) || CON_VELO.has(nombre);
  if (velo) $("velo").classList.add("sube");
  setTimeout(() => {                                          // 2) ...y entra la nueva
    aplicar(destino);
    $("velo").classList.remove("sube");
    ocupado = false;
    if (destino !== estado.vista) mostrarPantalla(destino);   // si mientras tanto pidieron otra, se va a esa
  }, MS_SALIDA);
}
