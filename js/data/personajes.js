// Base de datos de personajes. Para añadir uno nuevo: copia un bloque y cambia los datos.
// tipo: piedra-papel-tijeras (fuego > planta > agua > fuego) | vida: vida máxima | danio: daño del ataque básico
export const PERSONAJES = {
  fuego_01:  { id: "fuego_01",  nombre: "Ignis", tipo: "fuego",  nivel: 1, color: "#db5736", vida: 25, danio: 3 },
  agua_01:   { id: "agua_01",   nombre: "Marea", tipo: "agua",   nivel: 1, color: "#3a9bd9", vida: 28, danio: 5 },
  planta_01: { id: "planta_01", nombre: "Brote", tipo: "planta", nivel: 1, color: "#5cb85c", vida: 30, danio: 4 },
};
