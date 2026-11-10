// Todo lo que se dibuja en el Canvas 2D: fondo de estrellas y la medalla del personaje.
import { estado, personajeActual } from "./estado.js";

const lienzo = document.getElementById("lienzo");
const c = lienzo.getContext("2d");
// Carga de imágenes: se piden una sola vez y se dibujan cuando están listas (devuelve null mientras tanto)
const imagenes = {};
function imagen(src) {
  if (!src) return null;
  if (!imagenes[src]) { imagenes[src] = new Image(); imagenes[src].src = src; }
  const i = imagenes[src];
  return i.complete && i.naturalWidth ? sombrear(i, src) : null;
}

// Resolución nítida: el canvas se dibuja en coordenadas 960x540, pero su tamaño real se ajusta a la pantalla (y a su densidad de píxeles)
function ajustarResolucion() {
  const r = lienzo.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.min(Math.round(r.width * dpr), 3840), h = Math.round(w * 9 / 16);
  if (lienzo.width !== w) { lienzo.width = w; lienzo.height = h; }
  c.setTransform(w / 960, 0, 0, h / 540, 0, 0);
  c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
}

// Volumen: el arte se sombrea una sola vez (luz arriba-izquierda, sombra abajo-derecha) en un canvas aparte,
// y al dibujarlo se le añade una sombra proyectada. Ajusta los números de aquí para más o menos efecto.
const VOLUMEN = { luz: 0.12, sombraLado: 0.30, sombraSuelo: 0.28, proyeccion: 0.6 };
const conVolumen = {};
function sombrear(img, src) {
  if (conVolumen[src]) return conVolumen[src];
  const o = document.createElement("canvas"), g = o.getContext("2d");
  o.width = img.naturalWidth; o.height = img.naturalHeight;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-atop";                 // solo pinta encima de la figura, no del fondo transparente
  const lado = g.createLinearGradient(0, 0, o.width, 0);
  lado.addColorStop(0, `rgba(255,255,255,${VOLUMEN.luz})`); lado.addColorStop(.35, "rgba(255,255,255,0)");
  lado.addColorStop(1, `rgba(10,8,40,${VOLUMEN.sombraLado})`);
  g.fillStyle = lado; g.fillRect(0, 0, o.width, o.height);
  const suelo = g.createLinearGradient(0, o.height * .55, 0, o.height);
  suelo.addColorStop(0, "rgba(10,8,40,0)"); suelo.addColorStop(1, `rgba(10,8,40,${VOLUMEN.sombraSuelo})`);
  g.fillStyle = suelo; g.fillRect(0, 0, o.width, o.height);
  o.naturalWidth = o.width; o.naturalHeight = o.height;       // para usarlo igual que una imagen normal
  return (conVolumen[src] = o);
}

function dibujarConVolumen(img, x, y, w, h) {
  const k = lienzo.width / 960;                               // las sombras de canvas no escalan solas con setTransform
  c.save();
  c.shadowColor = `rgba(0,0,0,${VOLUMEN.proyeccion})`;
  c.shadowBlur = 22 * k; c.shadowOffsetX = 9 * k; c.shadowOffsetY = 8 * k;
  c.drawImage(img, x, y, w, h);
  c.restore();
}

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
// Splash art del personaje cargado: ocupa la mitad izquierda, de pie sobre el borde inferior
function dibujarSplash(img, color, anclaX) {
  const x = 255, h = 480, w = h * img.naturalWidth / img.naturalHeight;   // x = dónde queda el cuerpo del personaje
  const brillo = c.createRadialGradient(x, 300, 20, x, 300, 250);
  brillo.addColorStop(0, color + "66"); brillo.addColorStop(1, color + "00");   // mismo color, sin opacidad (así no se oscurece)
  c.fillStyle = brillo; c.fillRect(x - 260, 40, 520, 500);
  dibujarConVolumen(img, x - anclaX * w, 540 - h, w, h);
}

function dibujarMedalla(t) {
  const p = personajeActual();
  const arte = imagen(p?.splash);
  if (arte) return dibujarSplash(arte, p.color, p.anclaX ?? 0.5);
  if (p?.splash) return;                                // la imagen aún se está cargando
  const x = 259, y = 235 + Math.sin(t / 700) * 8;
  const color = p ? p.color : "#555a73";

  const brillo = c.createRadialGradient(x, y, 30, x, y, 210);
  brillo.addColorStop(0, color + "88"); brillo.addColorStop(1, color + "00");
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
  const sprite = !esEnemigo && imagen(u.sprite);
  if (sprite) {                                              // imagen del personaje, con los pies sobre la sombra
    const h = 330, w = h * sprite.naturalWidth / sprite.naturalHeight;
    dibujarConVolumen(sprite, x - u.anclaX * w, y + 82 - h, w, h);     // los pies (anclaX) quedan sobre el centro de la sombra
    c.globalAlpha = 1; return;
  }
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
  dibujarLuchador(b.jugador, 200, 260, false);
  dibujarLuchador(b.enemigo, 740, 260, true);
}

export function dibujar(t) {
  ajustarResolucion();
  dibujarFondo();
  if (estado.escena === "combate") dibujarCombate(); else dibujarMedalla(t);
}
