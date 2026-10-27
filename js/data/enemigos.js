// Enemigos. vidaMax = vida total | danio = daño que hace en cada uno de sus turnos
// Opcionales: intro = frase al empezar la pelea | tamano = escala al dibujarlo (1 = normal)
export const ENEMIGOS = {
  generico_01: { id: "generico_01", nombre: "Sombra errante", color: "#7a2e4d", vidaMax: 24, danio: 3 },
  lobo_ceniza: { id: "lobo_ceniza", nombre: "Lobo de ceniza", color: "#8a6d3b", vidaMax: 32, danio: 4,
                 intro: "Un lobo de ceniza te corta el paso" },
  coloso_vacio: { id: "coloso_vacio", nombre: "Coloso del vacío", color: "#241a3a", vidaMax: 150, danio: 12, tamano: 1.25,
                  intro: "El Coloso del vacío te mira... no hay forma de ganar esto" },
};
