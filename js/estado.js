// Estado global del juego: aquí vive ID_personaje y los ajustes.
import { PERSONAJES } from "./data/personajes.js";
import { datos, registrarInvocacion } from "./guardado.js";

export const estado = {
  // <- AQUÍ se guardará el id leído por el NFC (null = sin medalla). Al abrir el juego se recupera la última medalla guardada.
  ID_personaje: PERSONAJES[datos.ultimoPersonaje] ? datos.ultimoPersonaje : null,
  vista: null,              // pantalla que se está viendo ahora (la actualiza pantallas.js)
  escena: "titulo",         // fondo del canvas: "titulo" | "menu" | "combate" (lo usa render.js)
  dialogo: null,            // escena en reproducción (la maneja escenas.js; render.js la dibuja)
  batalla: null,            // datos de la pelea en curso (lo rellena combate.js)
  ajustes: { general: 70, musica: 50, efectos: 80, silenciado: false },
};

// Recuperar ajustes guardados en el navegador (si existen)
try {
  const guardado = JSON.parse(localStorage.getItem("medalion_ajustes"));
  if (guardado) Object.assign(estado.ajustes, guardado);
} catch (e) { /* sin almacenamiento: usamos los valores por defecto */ }

export function guardarAjustes() {
  try { localStorage.setItem("medalion_ajustes", JSON.stringify(estado.ajustes)); } catch (e) {}
}

export function personajeActual() {
  return PERSONAJES[estado.ID_personaje] ?? null;
}

// Llama a esta función cuando el lector NFC detecte una medalla.
export function cargarPersonaje(id) {
  estado.ID_personaje = PERSONAJES[id] ? id : null;
  if (estado.ID_personaje) registrarInvocacion(id);      // cuenta como "invocación" (guardado.js)
  document.dispatchEvent(new Event("personaje-cambiado"));
}
