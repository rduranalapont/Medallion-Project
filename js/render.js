// Todo lo que se dibuja en el Canvas 2D: fondo de estrellas y la medalla del personaje.
import { estado, personajeActual } from "./estado.js";

const lienzo = document.getElementById("lienzo");
const c = lienzo.getContext("2d");
// Carga de imágenes: se piden una sola vez y se dibujan cuando están listas (devuelve null mientras tanto)
const imagenes = {};
function cargar(src) {                                          // imagen tal cual (fondos)
  if (!src) return null;
  if (!imagenes[src]) { imagenes[src] = new Image(); imagenes[src].src = src; }
  const i = imagenes[src];
  return i.complete && i.naturalWidth ? i : null;
}
function imagen(src) {                                          // imagen con volumen (personajes)
  const i = cargar(src);
  return i ? sombrear(i, src) : null;
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

// Animaciones de entrada: progreso(t0, duración) va de 0 a 1 con frenada suave desde el instante t0
const progreso = (t0, dur) => 1 - Math.pow(1 - Math.min(1, Math.max(0, (performance.now() - t0) / dur)), 3);
let escenaPrevia = null, tEscena = 0;

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
function dibujarSplash(img, color, anclaX, e = 1) {                 // e: progreso de la animación de entrada (0 a 1)
  const x = 255 - (1 - e) * 40, h = 480, w = h * img.naturalWidth / img.naturalHeight;   // x = dónde queda el cuerpo del personaje
  c.globalAlpha = e;
  const brillo = c.createRadialGradient(x, 300, 20, x, 300, 250);
  brillo.addColorStop(0, color + "66"); brillo.addColorStop(1, color + "00");   // mismo color, sin opacidad (así no se oscurece)
  c.fillStyle = brillo; c.fillRect(x - 260, 40, 520, 500);
  dibujarConVolumen(img, x - anclaX * w, 540 - h, w, h);
  c.globalAlpha = 1;
}

// Emblema del juego: el título y los menús sin personaje muestran un medallón con anillos que giran.
// Se desliza (y encoge) del centro del título a la izquierda de los menús.
const emblema = { x: 480, y: 262, r: 215, a: 0 };
function dibujarTitulo(t) {
  const meta = estado.vista === "inicio" ? { x: 480, y: 262, r: 215, a: 0.5 } : { x: 255, y: 292, r: 165, a: 1 };
  for (const k of ["x", "y", "r", "a"]) emblema[k] += (meta[k] - emblema[k]) * 0.09;
  const { x, y, r, a } = emblema;
  if (a < 0.01) return;
  c.save(); c.globalAlpha = a; c.translate(x, y);
  const brillo = c.createRadialGradient(0, 0, r * .2, 0, 0, r * 1.5);
  brillo.addColorStop(0, "#d9b45a55"); brillo.addColorStop(1, "#d9b45a00");
  c.fillStyle = brillo; c.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
  c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = "#1a1f3d"; c.fill();            // disco y aro dorado
  c.lineWidth = r * .045; c.strokeStyle = "#d9b45a"; c.stroke();
  c.save(); c.rotate(t / 9000); c.strokeStyle = "#d9b45a";                             // marcas giratorias
  for (let i = 0; i < 48; i++) {
    c.rotate(Math.PI / 24); c.lineWidth = r * (i % 4 ? .01 : .018);
    c.beginPath(); c.moveTo(r * .88, 0); c.lineTo(r * (i % 4 ? .83 : .78), 0); c.stroke();
  }
  c.restore();
  c.save(); c.rotate(-t / 14000); c.setLineDash([r * .08, r * .05]);                  // anillo discontinuo en sentido contrario
  c.lineWidth = r * .012; c.strokeStyle = "rgba(239,227,194,.7)";
  c.beginPath(); c.arc(0, 0, r * .68, 0, 7); c.stroke(); c.restore();
  c.beginPath(); c.arc(0, 0, r * .55, 0, 7); c.fillStyle = "#232a52"; c.fill();       // núcleo con la inicial del juego
  c.lineWidth = r * .02; c.strokeStyle = "#d9b45a"; c.stroke();
  if (estado.vista !== "inicio") {                                                    // en el título el nombre del juego ya ocupa el centro
    c.fillStyle = "#d9b45a"; c.font = `700 ${r * .62}px Cinzel, serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("M", 0, r * .03);
  }
  c.restore();
}

function dibujarMedalla(t) {
  const p = personajeActual();
  const arte = imagen(p?.splash);
  if (arte) return dibujarSplash(arte, p.color, p.anclaX ?? 0.5, progreso(tEscena, 600));
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
function dibujarLuchador(u, x, y, esEnemigo, e = 1) {
  const k = u.tamano ?? 1;                                    // escala (los jefes son más grandes)
  x += (esEnemigo ? 1 : -1) * (1 - e) * 140;                  // entran deslizándose desde los lados
  c.globalAlpha = (u.vida > 0 ? 1 : .25) * e;                       // derrotado = casi transparente
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
  const e = progreso((b.t0 ?? 0) + 150, 700);
  dibujarLuchador(b.jugador, 200, 260, false, e);
  dibujarLuchador(b.enemigo, 740, 260, true, e);
}

// ---------- Escenas de diálogo ----------
// Fondo a pantalla completa (recortado para cubrir, como "background-size: cover"); sin imagen, un degradado oscuro
function dibujarFondoEscena(src) {
  const img = cargar(src);
  if (img) {
    const k = Math.max(960 / img.naturalWidth, 540 / img.naturalHeight), w = img.naturalWidth * k, h = img.naturalHeight * k;
    c.drawImage(img, (960 - w) / 2, (540 - h) / 2, w, h);
  } else {
    const g = c.createLinearGradient(0, 0, 0, 540);
    g.addColorStop(0, "#1d2342"); g.addColorStop(1, "#0b0d1c");
    c.fillStyle = g; c.fillRect(0, 0, 960, 540);
  }
  const sombra = c.createLinearGradient(0, 230, 0, 540);          // oscurece abajo para que se lea la caja de texto
  sombra.addColorStop(0, "rgba(0,0,0,0)"); sombra.addColorStop(1, "rgba(0,0,0,.5)");
  c.fillStyle = sombra; c.fillRect(0, 230, 960, 310);
}

// Arte del que habla, ajustado: grande, anclado por el cuerpo y cortado por la caja de texto
function dibujarRetratoEscena(l) {
  const img = imagen(l?.imagen);
  if (!img) return;
  const h = 620 * (l.encuadre.escala ?? 1), w = h * img.naturalWidth / img.naturalHeight;
  const e = progreso(estado.dialogo?.t0 ?? 0, 380);              // entra deslizándose desde su lado
  const x = (l.lado === "derecha" ? 580 : 380) + (l.lado === "derecha" ? 1 : -1) * (1 - e) * 45;   // dónde queda el cuerpo
  c.globalAlpha = e;
  dibujarConVolumen(img, x - l.anclaX * w, 14 + (l.encuadre.y ?? 0), w, h);
  c.globalAlpha = 1;
}

export function dibujar(t) {
  ajustarResolucion();
  if (estado.escena !== escenaPrevia) { escenaPrevia = estado.escena; tEscena = performance.now(); }
  const d = estado.vista === "escena" ? estado.dialogo : null;   // el diálogo solo se dibuja cuando su pantalla ya se está viendo
  if (d?.def.tipo === "cinematica") { dibujarFondoEscena(d.actual?.fondo); dibujarRetratoEscena(d.actual); return; }
  dibujarFondo();
  if (estado.escena === "combate") { emblema.a = 0; dibujarCombate(); }
  else if (estado.escena === "titulo") dibujarTitulo(t);
  else { emblema.a = 0; dibujarMedalla(t); }
  if (d) {                                                        // diálogo sobre el combate: fondo que se oscurece + arte
    c.fillStyle = `rgba(5,6,15,${.62 * progreso(d.tInicio, 350)})`; c.fillRect(0, 0, 960, 540);
    dibujarRetratoEscena(d.actual);
  }
}
