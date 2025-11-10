const axios = require('axios');

class TMDbService {
  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.baseURL = 'https://api.themoviedb.org/3';
    
    if (!this.apiKey) {
      throw new Error('TMDB_API_KEY is not defined in environment variables');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      params: {
        api_key: this.apiKey,
        language: 'es-ES' // Cambia a 'en-US' si prefieres inglés
      }
    });
  }

  /**
   * Obtener películas populares
   */
  async getPopularMovies(page = 1) {
    try {
      const response = await this.client.get('/movie/popular', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching popular movies: ${error.message}`);
    }
  }

  /**
   * Obtener películas mejor valoradas
   */
  async getTopRatedMovies(page = 1) {
    try {
      const response = await this.client.get('/movie/top_rated', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching top rated movies: ${error.message}`);
    }
  }

  /**
   * Obtener películas en cartelera
   */
  async getNowPlayingMovies(page = 1) {
    try {
      const response = await this.client.get('/movie/now_playing', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching now playing movies: ${error.message}`);
    }
  }

  /**
   * Obtener películas próximamente
   */
  async getUpcomingMovies(page = 1) {
    try {
      const response = await this.client.get('/movie/upcoming', {
        params: { page }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching upcoming movies: ${error.message}`);
    }
  }

  /**
   * Obtener detalles completos de una película
   */
  async getMovieDetails(movieId) {
    try {
      const response = await this.client.get(`/movie/${movieId}`, {
        params: {
          append_to_response: 'credits,videos,images'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching movie details: ${error.message}`);
    }
  }

  /**
   * Obtener créditos de una película (cast y crew)
   */
  async getMovieCredits(movieId) {
    try {
      const response = await this.client.get(`/movie/${movieId}/credits`);
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching movie credits: ${error.message}`);
    }
  }

  /**
   * Buscar películas por título
   */
  async searchMovies(query, page = 1) {
    try {
      const response = await this.client.get('/search/movie', {
        params: { query, page }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error searching movies: ${error.message}`);
    }
  }

  /**
   * Obtener todos los géneros
   */
  async getGenres() {
    try {
      const response = await this.client.get('/genre/movie/list');
      return response.data.genres;
    } catch (error) {
      throw new Error(`Error fetching genres: ${error.message}`);
    }
  }

  /**
   * Obtener películas por género
   */
  async getMoviesByGenre(genreId, page = 1) {
    try {
      const response = await this.client.get('/discover/movie', {
        params: {
          with_genres: genreId,
          sort_by: 'popularity.desc',
          page
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching movies by genre: ${error.message}`);
    }
  }

  /**
   * Obtener detalles de una persona
   */
  async getPersonDetails(personId) {
    try {
      const response = await this.client.get(`/person/${personId}`, {
        params: {
          append_to_response: 'movie_credits'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error fetching person details: ${error.message}`);
    }
  }

  /**
   * Buscar personas por nombre
   */
  async searchPeople(query, page = 1) {
    try {
      const response = await this.client.get('/search/person', {
        params: { query, page }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Error searching people: ${error.message}`);
    }
  }

  /**
   * Formatear datos de película de TMDb a nuestro formato
   */
  formatMovieData(tmdbMovie) {
    return {
      title: tmdbMovie.title,
      original_title: tmdbMovie.original_title,
      overview: tmdbMovie.overview,
      release_date: tmdbMovie.release_date,
      runtime: tmdbMovie.runtime || null,
      original_language: tmdbMovie.original_language,
      tmdb_id: tmdbMovie.id,
      poster_path: tmdbMovie.poster_path,
      backdrop_path: tmdbMovie.backdrop_path
      // popularity, vote_average, vote_count eliminados - se calcularán desde reviews propias
    };
  }

  /**
   * Formatear datos de persona de TMDb a nuestro formato
   */
  formatPersonData(tmdbPerson) {
    // TMDB solo proporciona el nombre completo, no separado en first_name y last_name
    // Intentamos una separación básica, pero priorizamos el campo 'name' completo
    const fullName = tmdbPerson.name || '';
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts.length > 0 ? nameParts[0] : fullName;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    return {
      name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      tmdb_id: tmdbPerson.id,
      profile_path: tmdbPerson.profile_path
      // birth_date y biography eliminados - no disponibles en credits API
    };
  }
}

module.exports = TMDbService;
