// Estado global del juego: aquí vive ID_personaje y los ajustes.
import { PERSONAJES } from "./data/personajes.js";

export const estado = {
  ID_personaje: "fuego_01",   // <- AQUÍ se guardará el id leído por el NFC (null = sin medalla)
  escena: "menu",           // "menu" | "combate" (lo usa render.js para saber qué dibujar)
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
  document.dispatchEvent(new Event("personaje-cambiado"));
}
