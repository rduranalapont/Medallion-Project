// Punto de entrada: arranca el menú y el bucle de dibujo del canvas.
import { iniciarMenu } from "./menu.js";
import { prepararCombate } from "./combate.js";
import { prepararEscenas } from "./escenas.js";
import { dibujar } from "./render.js";
import { cargarPersonaje } from "./estado.js";
import { iniciarCronometro } from "./guardado.js";

iniciarCronometro();
iniciarMenu();
prepararCombate();
prepararEscenas();
const bucle = (t) => { dibujar(t); requestAnimationFrame(bucle); };
requestAnimationFrame(bucle);

// Para probar el cambio de medalla desde la consola del navegador:  cargarPersonaje("agua_01")
window.cargarPersonaje = cargarPersonaje;
