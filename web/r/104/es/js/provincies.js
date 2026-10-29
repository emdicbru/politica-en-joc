// Províncies i diputats de cada circumscripció. Els fan servir l'app i els widgets per a altres webs (widget/).
// Diputats per circumscripció el 29N (Reial decret 806/2026): Madrid en guanya un i Cadis en perd un respecte del 2023
const PROVINCES = [
  ["Madrid", 38], ["Barcelona", 32], ["Valencia", 16], ["Alicante", 12], ["Sevilla", 12],
  ["Málaga", 11], ["Murcia", 10], ["Cádiz", 8], ["Islas Baleares", 8], ["Vizcaya", 8],
  ["A Coruña", 8], ["Las Palmas", 8], ["Asturias", 7], ["Granada", 7], ["Pontevedra", 7],
  ["Santa Cruz de Tenerife", 7], ["Zaragoza", 7], ["Almería", 6], ["Córdoba", 6], ["Girona", 6],
  ["Guipúzcoa", 6], ["Tarragona", 6], ["Toledo", 6], ["Badajoz", 5], ["Cantabria", 5],
  ["Castellón", 5], ["Ciudad Real", 5], ["Huelva", 5], ["Jaén", 5], ["Navarra", 5],
  ["Valladolid", 5], ["Álava", 4], ["Albacete", 4], ["Burgos", 4], ["Cáceres", 4],
  ["León", 4], ["Lleida", 4], ["Lugo", 4], ["Ourense", 4], ["La Rioja", 4],
  ["Salamanca", 4], ["Ávila", 3], ["Cuenca", 3], ["Guadalajara", 3], ["Huesca", 3],
  ["Palencia", 3], ["Segovia", 3], ["Teruel", 3], ["Zamora", 3], ["Soria", 2],
  ["Ceuta", 1], ["Melilla", 1],
].map(([name, seats]) => ({ name, seats }));
