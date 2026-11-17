// GUARDADO. Dos capas:
//  1) Siempre: el navegador (localStorage), automático.
//  2) Opcional: un archivo .txt de TU disco. Lo eliges UNA sola vez (disquete o Ajustes) y desde entonces se escribe solo,
//     sin descargas ni diálogos (API de archivos de Chrome/Edge). En otros navegadores se descarga una copia al pulsar el disquete.
// Para añadir un dato nuevo a la partida: ponlo en DEFECTO y listo.
const CLAVE = "medallion_partida", CLAVE_ANTIGUA = "medalion_partida";   // la antigua se migra sola

const DEFECTO = {
  version: 2,
  modificado: 0,                      // marca de tiempo del último guardado (decide qué copia es más reciente)
  introVista: false,                  // true = ya se vio la introducción (cinemática de la primera vez)
  ultimoPersonaje: null,              // última medalla cargada (se recupera al abrir; sin NFC es lo que hay)
  tiempoJugado: 0,                    // segundos
  invocaciones: { total: 0, porPersonaje: {} },
  enemigosDerrotados: { total: 0, porEnemigo: {} },
  capitulosCompletados: [],           // ids de capítulo
  muertes: 0,
  vistos: { personajes: [], enemigos: [] },   // para desbloquear el bestiario
  modoInfinito: { record: 0 },                 // máximo de enemigos derrotados en una sola racha
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
    d.version = Math.max(Number(guardado.version) || 0, DEFECTO.version);
  }
  return d;
}

function leer() {
  try {
    const nuevo = localStorage.getItem(CLAVE), antiguo = localStorage.getItem(CLAVE_ANTIGUA);
    return JSON.parse(nuevo ?? antiguo);
  } catch (e) { return null; }
}

export let datos = completar(leer());

const texto = () => JSON.stringify(datos, null, 2);
const valida = (o) => o && typeof o === "object" && o.version !== undefined;

// ---------- Archivo .txt en tu disco ----------
export const soportaArchivo = "showSaveFilePicker" in window && "showOpenFilePicker" in window;
const TIPOS_ARCHIVO = [{ description: "Partida de Medallion Project", accept: { "text/plain": [".txt"] } }];
// Detector de recarga continua: Live Server (y similares) recargan la página cuando cambia un archivo de la carpeta del proyecto.
// Si el archivo de guardado está ahí, cada guardado provocaría otra recarga. Si la página se carga 4 veces en 15 s, se pausa el guardado en archivo.
// Además: si la página se carga justo después de que el juego escribiera el archivo, esa escritura la ha recargado (el archivo está
// en una carpeta vigilada). Se marca y se deja de escribir en ese archivo; hay que elegir otra ubicación.
const CLAVE_BLOQUEO = "medallion_guardado_pausado";
export const recargadaPorGuardado = (() => {
  try {
    const t = Number(sessionStorage.getItem("medallion_escritura") || 0);
    sessionStorage.removeItem("medallion_escritura");
    if (t > 0 && Date.now() - t < 4000) { localStorage.setItem(CLAVE_BLOQUEO, "1"); return true; }
  } catch (e) {}
  return false;
})();
let pausado = (() => {
  try {
    const m = JSON.parse(sessionStorage.getItem("medallion_cargas") ?? "[]").filter((t) => Date.now() - t < 15000);
    m.push(Date.now()); sessionStorage.setItem("medallion_cargas", JSON.stringify(m));
    return m.length >= 4 || localStorage.getItem(CLAVE_BLOQUEO) === "1";
  } catch (e) { return false; }
})();
function reanudar() {                                              // se ha elegido un archivo nuevo: se vuelve a intentar
  pausado = false;
  try { sessionStorage.removeItem("medallion_cargas"); localStorage.removeItem(CLAVE_BLOQUEO); } catch (e) {}
}

// "Firma" del contenido que importa: solo se reescribe el archivo si algo cambió de verdad (no por el reloj ni la marca de tiempo)
const firmaDe = (d) => JSON.stringify({ ...d, modificado: 0 });
let ultimaFirma = null;

let archivo = null, permiso = "sin";          // permiso: "sin" (no hay archivo) | "pendiente" (hay que pedir permiso con un clic) | "listo"
let temporizador = null;

export const estadoArchivo = () => ({ nombre: archivo?.name ?? null, permiso: pausado && archivo ? "pausado" : permiso });
function avisarArchivo() { document.dispatchEvent(new Event("archivo-cambiado")); }

// Pequeña base de datos del navegador, solo para recordar CUÁL es el archivo elegido entre sesiones
const bd = () => new Promise((ok, mal) => {
  const r = indexedDB.open("medallion", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("kv");
  r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error);
});
const kvLeer = async (k) => { try { const db = await bd(); return await new Promise((ok) => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ok(null); }); } catch (e) { return null; } };
const kvEscribir = async (k, v) => { try { const db = await bd(); await new Promise((ok) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = ok; t.onerror = ok; }); } catch (e) {} };

async function vincular(h) {
  archivo = h; permiso = "listo"; await kvEscribir("archivo", h); avisarArchivo();
}

async function escribirArchivo(forzar = false) {
  if (!archivo || permiso !== "listo" || pausado) return false;
  if (!forzar && firmaDe(datos) === ultimaFirma) return true;                  // nada nuevo: no se toca el archivo
  try {
    try { sessionStorage.setItem("medallion_escritura", String(Date.now())); } catch (e) {}   // si la página se recarga ahora, sabremos por qué
    const w = await archivo.createWritable(); await w.write(texto()); await w.close(); ultimaFirma = firmaDe(datos); return true;
  } catch (e) { permiso = "pendiente"; avisarArchivo(); return false; }   // sin permiso o archivo movido: se vuelve a pedir
}

// Compara el archivo con lo que hay en el navegador y se queda con lo más reciente
async function sincronizar() {
  try {
    const nuevo = JSON.parse(await (await archivo.getFile()).text());
    if (valida(nuevo)) ultimaFirma = firmaDe(completar(nuevo));                // lo que ya contiene el archivo
    if (valida(nuevo) && (nuevo.modificado ?? 0) > datos.modificado) {
      datos = completar(nuevo); ultimaFirma = firmaDe(datos); localStorage.setItem(CLAVE, texto());
      document.dispatchEvent(new Event("partida-cargada"));
      return;
    }
  } catch (e) { /* archivo vacío o ilegible: se sobrescribe con la partida actual */ }
  await escribirArchivo();
}

// Al abrir el juego: recupera el archivo elegido la última vez
export async function iniciarArchivo() {
  if (!soportaArchivo) return;
  const h = await kvLeer("archivo");
  if (!h) return;
  archivo = h;
  permiso = (await h.queryPermission({ mode: "readwrite" })) === "granted" ? "listo" : "pendiente";
  avisarArchivo();
  if (permiso === "listo") await sincronizar();
}

// Hay que llamarla desde un clic o tecla (el navegador pide permiso al usuario)
export async function reconectar() {
  if (permiso !== "pendiente" || !archivo) return;
  try {
    if ((await archivo.requestPermission({ mode: "readwrite" })) === "granted") { permiso = "listo"; avisarArchivo(); await sincronizar(); }
  } catch (e) {}
}

// Elegir dónde se guarda (solo se hace una vez). Devuelve true si se eligió un archivo
export async function elegirArchivo() {
  if (!soportaArchivo) return false;
  try {
    await vincular(await showSaveFilePicker({ suggestedName: "medallion_partida.txt", types: TIPOS_ARCHIVO, startIn: "documents" }));
    reanudar();                                                // archivo nuevo: se reanuda el guardado
    ultimaFirma = null; await escribirArchivo(true); return true;
  } catch (e) { return false; }                               // cancelado
}

// Cargar una partida desde un .txt y usarlo desde ahora como archivo de guardado
export async function cargarArchivo() {
  try {
    const [h] = await showOpenFilePicker({ types: TIPOS_ARCHIVO, startIn: "documents" });
    const nuevo = JSON.parse(await (await h.getFile()).text());
    if (!valida(nuevo)) return "invalido";
    datos = completar(nuevo); localStorage.setItem(CLAVE, texto());
    await vincular(h); reanudar();
    if ((await h.requestPermission({ mode: "readwrite" })) !== "granted") { permiso = "pendiente"; avisarArchivo(); }
    document.dispatchEvent(new Event("partida-cargada"));
    return "ok";
  } catch (e) { return e?.name === "AbortError" ? "cancelado" : "invalido"; }
}

// Alternativa para navegadores sin acceso a archivos: descarga una copia
export async function cargarDesdeTexto(archivoTxt) {
  try {
    const nuevo = JSON.parse(await archivoTxt.text());
    if (!valida(nuevo)) return false;
    datos = completar(nuevo); localStorage.setItem(CLAVE, texto());
    document.dispatchEvent(new Event("partida-cargada")); return true;
  } catch (e) { return false; }
}
function descargarCopia() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([texto()], { type: "text/plain" })); a.download = "medallion_partida.txt";
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- Guardado ----------
export function guardar(tambienArchivo = true) {
  datos.modificado = Date.now();
  try { localStorage.setItem(CLAVE, texto()); } catch (e) { /* sin almacenamiento */ }
  if (tambienArchivo) { clearTimeout(temporizador); temporizador = setTimeout(() => escribirArchivo(), 600); }   // autoguardado en el archivo (si hay uno y algo cambió)
}

// Botón del disquete. Devuelve dónde se guardó: "archivo" | "navegador" | "descarga"
export async function guardarAhora() {
  guardar();
  if (!soportaArchivo) { descargarCopia(); return "descarga"; }
  if (!archivo) { if (!(await elegirArchivo())) return "navegador"; return "archivo"; }      // primera vez: elige dónde
  if (pausado) return (await elegirArchivo()) ? "archivo" : "pausado";     // pausado: la única salida es elegir otro sitio
  if (permiso === "pendiente") await reconectar();
  clearTimeout(temporizador);
  return (await escribirArchivo(true)) ? "archivo" : "navegador";
}

// ---------- Registros de lo que pasa en el juego ----------
function avisarEstadisticas() { document.dispatchEvent(new Event("estadisticas-cambiadas")); }

export function registrarInvocacion(id) {
  datos.invocaciones.total++;
  datos.invocaciones.porPersonaje[id] = (datos.invocaciones.porPersonaje[id] ?? 0) + 1;
  datos.ultimoPersonaje = id;
  if (!datos.vistos.personajes.includes(id)) datos.vistos.personajes.push(id); // invocar por primera vez descubre al personaje
  guardar(); avisarEstadisticas();
}
export function registrarVisto(tipo, id) {            // tipo: "personajes" | "enemigos"
  if (!datos.vistos[tipo].includes(id)) { datos.vistos[tipo].push(id); guardar(); avisarEstadisticas(); }
}
export function registrarDerrota(idEnemigo) {          // un enemigo derrotado
  datos.enemigosDerrotados.total++;
  datos.enemigosDerrotados.porEnemigo[idEnemigo] = (datos.enemigosDerrotados.porEnemigo[idEnemigo] ?? 0) + 1;
  guardar(); avisarEstadisticas();
}
export function registrarRecordInfinito(enemigosDerrotados) {
  datos.modoInfinito ??= { record: 0 };
  datos.modoInfinito.record = Math.max(datos.modoInfinito.record ?? 0, enemigosDerrotados);
  guardar(); avisarEstadisticas();
}
export function registrarMuerte() { datos.muertes++; guardar(); avisarEstadisticas(); }
export function completarCapitulo(id) {
  if (!datos.capitulosCompletados.includes(id)) datos.capitulosCompletados.push(id);
  guardar(); avisarEstadisticas();
}
export function marcarIntroVista() { datos.introVista = true; guardar(); }

// ---------- Tiempo jugado (solo cuenta con la pestaña visible) ----------
export function iniciarCronometro() {
  let ticks = 0, segundosVisibles = 0;
  setInterval(() => {
    if (!document.hidden) { datos.tiempoJugado++; segundosVisibles++; }
    if (++ticks % 10 === 0) guardar(false); // actualización frecuente en el navegador
    if (segundosVisibles >= 60) {          // el .txt se actualiza una vez por minuto, sin escribir cada segundo
      segundosVisibles = 0; guardar(true);
    }
  }, 1000);
  document.addEventListener("visibilitychange", () => { if (document.hidden) guardar(true); });
  addEventListener("beforeunload", () => { datos.modificado = Date.now(); try { localStorage.setItem(CLAVE, texto()); } catch (e) {} });
}

export function borrarPartida() {
  datos = completar(null); guardar(); avisarEstadisticas();
  document.dispatchEvent(new Event("partida-cargada"));
}
