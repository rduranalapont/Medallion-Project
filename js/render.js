// Todo lo que se dibuja en el Canvas 2D: fondo de estrellas y la medalla del personaje.
import { estado, personajeActual } from "./estado.js";

const lienzo = document.getElementById("lienzo");
const c = lienzo.getContext("2d");
const estrellas = Array.from({ length: 90 }, () => ({
  x: Math.random() * 960, y: Math.random() * 540, r: Math.random() * 1.5 + .5, v: Math.random() * .3 + .05,
}));

function dibujarFondo() {
  const g = c.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, "#0d1024"); g.addColorStop(1, "#2a1f3d");
  c.fillStyle = g; c.fillRect(0, 0, 960, 540);
  c.fillStyle = "#efe3c2";
  for (const e of estrellas) {
    e.y += e.v; if (e.y > 540) e.y = 0;
    c.globalAlpha = .4 + e.r / 3; c.beginPath(); c.arc(e.x, e.y, e.r, 0, 7); c.fill();
  }
  c.globalAlpha = 1;
}

// Medalla grande en la mitad izquierda (el texto del personaje va debajo, en HTML)
function dibujarMedalla(t) {
  const p = personajeActual();
  const x = 259, y = 235 + Math.sin(t / 700) * 8;
  const color = p ? p.color : "#555a73";

  const brillo = c.createRadialGradient(x, y, 30, x, y, 210);
  brillo.addColorStop(0, color + "88"); brillo.addColorStop(1, "transparent");
  c.fillStyle = brillo; c.fillRect(x - 220, y - 220, 440, 440);

  c.beginPath(); c.arc(x, y, 125, 0, 7);
  c.fillStyle = "#1a1f3d"; c.fill();
  c.lineWidth = 7; c.strokeStyle = "#d9b45a"; c.stroke();

  c.beginPath(); c.arc(x, y, 90, 0, 7);
  c.fillStyle = color; c.fill();

  // Marcador de sprite: aquí irá la imagen real del personaje (c.drawImage)
  c.fillStyle = "#efe3c2"; c.font = "700 80px Cinzel, serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(p ? p.nombre[0] : "?", x, y + 4);
}

// Combate: personaje a la izquierda, enemigo a la derecha (formas provisionales, sin animación)
function dibujarLuchador(u, x, y, esEnemigo) {
  const k = u.tamano ?? 1;                                    // escala (los jefes son más grandes)
  c.globalAlpha = u.vida > 0 ? 1 : .25;                       // derrotado = casi transparente
  c.fillStyle = "rgba(0,0,0,.35)";                            // sombra en el suelo
  c.beginPath(); c.ellipse(x, y + 85 * k, 80 * k, 14, 0, 0, 7); c.fill();
  c.fillStyle = u.color; c.strokeStyle = "#d9b45a"; c.lineWidth = 6;
  c.beginPath();
  if (esEnemigo) { c.moveTo(x, y - 82 * k); c.lineTo(x + 72 * k, y); c.lineTo(x, y + 82 * k); c.lineTo(x - 72 * k, y); c.closePath(); }
  else c.arc(x, y, 72, 0, 7);
  c.fill(); c.stroke();
  c.fillStyle = "#efe3c2"; c.font = `700 ${60 * k}px Cinzel, serif`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(u.nombre[0], x, y + 4);
  c.globalAlpha = 1;
}

function dibujarCombate() {
  const b = estado.batalla; if (!b) return;
  dibujarLuchador(b.jugador, 200, 240, false);
  dibujarLuchador(b.enemigo, 740, 240, true);
}

export function dibujar(t) {
  dibujarFondo();
  if (estado.escena === "combate") dibujarCombate(); else dibujarMedalla(t);
}
