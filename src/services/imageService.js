/**
 * Utilidades para construir URLs de imágenes de TMDB
 * Documentación: https://developers.themoviedb.org/3/getting-started/images
 */

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/';

/**
 * Tamaños disponibles para posters:
 * w92, w154, w185, w342, w500, w780, original
 */
const POSTER_SIZES = {
  SMALL: 'w185',      // Para thumbnails pequeños
  MEDIUM: 'w342',     // Para cards normales
  LARGE: 'w500',      // Para detalles de película
  ORIGINAL: 'original' // Calidad máxima
};

/**
 * Tamaños disponibles para backdrops:
 * w300, w780, w1280, original
 */
const BACKDROP_SIZES = {
  SMALL: 'w300',
  MEDIUM: 'w780',
  LARGE: 'w1280',
  ORIGINAL: 'original'
};

/**
 * Tamaños disponibles para profiles (fotos de personas):
 * w45, w185, h632, original
 */
const PROFILE_SIZES = {
  SMALL: 'w45',
  MEDIUM: 'w185',
  LARGE: 'h632',
  ORIGINAL: 'original'
};

/**
 * Construir URL completa para un poster de película
 * @param {string} posterPath - El path del poster (ej: "/abc123.jpg")
 * @param {string} size - Tamaño del poster (default: MEDIUM)
 * @returns {string|null} - URL completa o null si no hay poster
 */
function getPosterUrl(posterPath, size = POSTER_SIZES.MEDIUM) {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE_URL}${size}${posterPath}`;
}

/**
 * Construir URL completa para un backdrop de película
 * @param {string} backdropPath - El path del backdrop
 * @param {string} size - Tamaño del backdrop (default: LARGE)
 * @returns {string|null} - URL completa o null si no hay backdrop
 */
function getBackdropUrl(backdropPath, size = BACKDROP_SIZES.LARGE) {
  if (!backdropPath) return null;
  return `${TMDB_IMAGE_BASE_URL}${size}${backdropPath}`;
}

/**
 * Construir URL completa para foto de perfil de persona
 * @param {string} profilePath - El path del profile
 * @param {string} size - Tamaño del profile (default: MEDIUM)
 * @returns {string|null} - URL completa o null si no hay profile
 */
function getProfileUrl(profilePath, size = PROFILE_SIZES.MEDIUM) {
  if (!profilePath) return null;
  return `${TMDB_IMAGE_BASE_URL}${size}${profilePath}`;
}

/**
 * Agregar URLs de imágenes a un objeto de película
 * @param {Object} movie - Objeto de película con poster_path y backdrop_path
 * @returns {Object} - Película con URLs completas agregadas
 */
function addMovieImageUrls(movie) {
  return {
    ...movie.toJSON ? movie.toJSON() : movie,
    poster_url: getPosterUrl(movie.poster_path),
    poster_url_large: getPosterUrl(movie.poster_path, POSTER_SIZES.LARGE),
    backdrop_url: getBackdropUrl(movie.backdrop_path)
  };
}

/**
 * Agregar URL de imagen a un objeto de persona
 * @param {Object} person - Objeto de persona con profile_path
 * @returns {Object} - Persona con URL completa agregada
 */
function addPersonImageUrl(person) {
  return {
    ...person.toJSON ? person.toJSON() : person,
    profile_url: getProfileUrl(person.profile_path)
  };
}

module.exports = {
  POSTER_SIZES,
  BACKDROP_SIZES,
  PROFILE_SIZES,
  getPosterUrl,
  getBackdropUrl,
  getProfileUrl,
  addMovieImageUrls,
  addPersonImageUrl
};
