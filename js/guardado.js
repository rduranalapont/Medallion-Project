// GUARDADO. Los datos se guardan solos en el navegador (localStorage) y se pueden exportar/importar como archivo .txt
// (texto legible en formato JSON). Un navegador no puede escribir archivos en tu disco sin que tú lo pidas,
// por eso el .txt se descarga/carga desde Ajustes. Para añadir un dato nuevo: ponlo en DEFECTO y listo.
const CLAVE = "medalion_partida";

const DEFECTO = {
  version: 1,
  introVista: false,                  // true = ya se vio la introducción (cinemática de la primera vez)
  ultimoPersonaje: null,              // última medalla cargada (se recupera al abrir; sin NFC es lo que hay)
  tiempoJugado: 0,                    // segundos
  invocaciones: { total: 0, porPersonaje: {} },
  enemigosDerrotados: { total: 0, porEnemigo: {} },
  capitulosCompletados: [],           // ids de capítulo
  muertes: 0,
  vistos: { personajes: [], enemigos: [] },   // para desbloquear el bestiario
};

const copia = (o) => JSON.parse(JSON.stringify(o));

// Mezcla lo guardado con los valores por defecto (así los datos nuevos no rompen partidas antiguas)
function completar(guardado) {
  const d = copia(DEFECTO);
  if (guardado && typeof guardado === "object") {
    for (const k of Object.keys(DEFECTO)) {
      if (guardado[k] === undefined) continue;
      d[k] = (typeof DEFECTO[k] === "object" && DEFECTO[k] !== null && !Array.isArray(DEFECTO[k]))
        ? { ...DEFECTO[k], ...guardado[k] } : guardado[k];
    }
  }
  return d;
}

export let datos = completar(leer());

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE)); } catch (e) { return null; }
}

export function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) { /* sin almacenamiento */ }
}

// ---------- Registros de lo que pasa en el juego ----------
export function registrarInvocacion(id) {
  datos.invocaciones.total++;
  datos.invocaciones.porPersonaje[id] = (datos.invocaciones.porPersonaje[id] ?? 0) + 1;
  datos.ultimoPersonaje = id; guardar();
}
export function registrarVisto(tipo, id) {            // tipo: "personajes" | "enemigos"
  if (!datos.vistos[tipo].includes(id)) { datos.vistos[tipo].push(id); guardar(); }
}
export function registrarDerrota(idEnemigo) {          // un enemigo derrotado
  datos.enemigosDerrotados.total++;
  datos.enemigosDerrotados.porEnemigo[idEnemigo] = (datos.enemigosDerrotados.porEnemigo[idEnemigo] ?? 0) + 1;
  guardar();
}
export function registrarMuerte() { datos.muertes++; guardar(); }
export function completarCapitulo(id) {
  if (!datos.capitulosCompletados.includes(id)) datos.capitulosCompletados.push(id);
  guardar();
}
export function marcarIntroVista() { datos.introVista = true; guardar(); }

// ---------- Tiempo jugado (solo cuenta con la pestaña visible) ----------
export function iniciarCronometro() {
  let n = 0;
  setInterval(() => { if (!document.hidden) datos.tiempoJugado++; if (++n % 10 === 0) guardar(); }, 1000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) guardar(); });
  addEventListener("beforeunload", guardar);
}

// ---------- Archivo .txt ----------
export function exportarTxt() {
  guardar();
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "medalion_partida.txt";
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importarTxt(archivo) {           // devuelve true si el archivo era válido
  try {
    const nuevo = JSON.parse(await archivo.text());
    if (!nuevo || typeof nuevo !== "object" || nuevo.version === undefined) return false;
    datos = completar(nuevo); guardar();
    document.dispatchEvent(new Event("partida-cargada"));
    return true;
  } catch (e) { return false; }
}

export function borrarPartida() {
  datos = completar(null); guardar();
  document.dispatchEvent(new Event("partida-cargada"));
}
