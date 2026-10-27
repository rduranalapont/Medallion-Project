// Cambia entre pantallas: "menu", "ajustes" o "combate". Para añadir una escena nueva: crea su <section id="pantalla-xxx"> y añádela aquí.
import { estado } from "./estado.js";

const PANTALLAS = ["menu", "ajustes", "combate"];

export function mostrarPantalla(nombre) {
  for (const p of PANTALLAS) document.getElementById("pantalla-" + p).hidden = p !== nombre;
  document.getElementById("info-personaje").hidden = nombre === "combate";
  estado.escena = nombre === "combate" ? "combate" : "menu";
}
