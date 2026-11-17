// Base de datos de personajes. Para añadir uno nuevo: copia un bloque y cambia los datos.
// tipo: "rushdown" | "zoner" | "grappler" (ver data/tipos.js) | vida: vida máxima | danio: daño del ataque básico
// Imágenes (opcionales, rutas desde index.html): splash = arte grande del menú | sprite = imagen en combate | retrato = cara del HUD
// anclaX = en qué punto horizontal de la imagen están los pies (0 = borde izquierdo, 0.5 = centro, 1 = borde derecho).
// Sirve para que el personaje quede centrado sobre su sombra aunque la imagen tenga un brazo o arma extendidos.
// Si falta alguna imagen, se dibuja una forma provisional con el color del personaje.
// Personaje que se consigue en la introducción ("NFC vacío") y que sale como arte principal del título
export const PERSONAJE_INTRODUCTORIO = "mayu_01";

export const PERSONAJES = {
  mayu_01: {
    id: "mayu_01", nombre: "Mayu", tipo: "rushdown", nivel: 1, color: "#9a8fb5", vida: 25, danio: 3,
    splash: "img/personajes/mayu.png",
    sprite: "img/personajes/mayu.png",            // PLACEHOLDER: se cambiará por la imagen de combate
    retrato: "img/personajes/mayu_retrato.png",
    descripcion: "La primera aliada de Medallion Project. Es rápida, decidida y aprovecha cada apertura para encadenar ataques.",
    anclaX: 0.5,
  },
  agua_01:   { id: "agua_01",   nombre: "Marea", tipo: "zoner",    nivel: 1, color: "#3a9bd9", vida: 28, danio: 5,
               descripcion: "Una combatiente que domina el espacio y controla el ritmo del enfrentamiento desde la distancia." },
  planta_01: { id: "planta_01", nombre: "Brote", tipo: "grappler", nivel: 1, color: "#5cb85c", vida: 30, danio: 4,
               descripcion: "Un luchador resistente que prefiere acercarse y convertir cada defensa en una oportunidad para golpear." },
};
