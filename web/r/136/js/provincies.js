// Províncies i diputats de cada circumscripció. Els fan servir l'app i els widgets per a altres webs (widget/).
// Diputats per circumscripció el 29N (Reial decret 806/2026): Madrid en guanya un i Cadis en perd un respecte del 2023
const PROVINCES = [
  ["Madrid", 38], ["Barcelona", 32], ["València", 16], ["Alacant", 12], ["Sevilla", 12],
  ["Màlaga", 11], ["Múrcia", 10], ["Cadis", 8], ["Illes Balears", 8], ["Biscaia", 8],
  ["la Corunya", 8], ["Las Palmas", 8], ["Astúries", 7], ["Granada", 7], ["Pontevedra", 7],
  ["Santa Cruz de Tenerife", 7], ["Saragossa", 7], ["Almeria", 6], ["Còrdova", 6], ["Girona", 6],
  ["Guipúscoa", 6], ["Tarragona", 6], ["Toledo", 6], ["Badajoz", 5], ["Cantàbria", 5],
  ["Castelló", 5], ["Ciudad Real", 5], ["Huelva", 5], ["Jaén", 5], ["Navarra", 5],
  ["Valladolid", 5], ["Àlaba", 4], ["Albacete", 4], ["Burgos", 4], ["Càceres", 4],
  ["Lleó", 4], ["Lleida", 4], ["Lugo", 4], ["Ourense", 4], ["La Rioja", 4],
  ["Salamanca", 4], ["Àvila", 3], ["Conca", 3], ["Guadalajara", 3], ["Osca", 3],
  ["Palència", 3], ["Segòvia", 3], ["Terol", 3], ["Zamora", 3], ["Sòria", 2],
  ["Ceuta", 1], ["Melilla", 1],
].map(([name, seats]) => ({ name, seats }));
