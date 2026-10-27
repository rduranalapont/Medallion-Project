// Audio con Web Audio API (sin archivos: genera tonos). Tres volúmenes: general, música, efectos.
import { estado } from "./estado.js";

let ctx, gGeneral, gMusica, gEfectos, temporizador;

function iniciar() {
  if (!ctx) {
    ctx = new AudioContext();
    gGeneral = ctx.createGain(); gMusica = ctx.createGain(); gEfectos = ctx.createGain();
    gMusica.connect(gGeneral); gEfectos.connect(gGeneral); gGeneral.connect(ctx.destination);
    aplicarVolumenes();
  }
  if (ctx.state === "suspended") ctx.resume();
}

export function aplicarVolumenes() {
  if (!ctx) return;
  const a = estado.ajustes;
  gGeneral.gain.value = a.silenciado ? 0 : a.general / 100;
  gMusica.gain.value = a.musica / 100;
  gEfectos.gain.value = a.efectos / 100;
}

function nota(frecuencia, duracion, destino, tipo, volumen) {
  const t = ctx.currentTime, osc = ctx.createOscillator(), g = ctx.createGain();
  osc.type = tipo; osc.frequency.value = frecuencia;
  g.gain.setValueAtTime(volumen, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duracion);
  osc.connect(g); g.connect(destino);
  osc.start(t); osc.stop(t + duracion);
}

export function sonidoClick() {
  iniciar(); nota(660, 0.12, gEfectos, "square", 0.2);
}

// Música provisional: un arpegio suave. Más adelante se cambiará por un archivo .mp3
export function iniciarMusica() {
  iniciar();
  if (temporizador) return;
  const escala = [220, 262, 330, 392, 330, 262]; let i = 0;
  temporizador = setInterval(() => nota(escala[i++ % escala.length], 1.2, gMusica, "triangle", 0.25), 600);
}
