require('dotenv').config();
const TMDbService = require('../services/tmdbService');
const { Genre, Movie, People, Credits, MovieGenre } = require('../models');
const { sequelize } = require('../config/database');

class TMDbImporter {
  constructor() {
    this.tmdbService = new TMDbService();
  }

  /**
   * Importar todos los géneros de TMDb
   */
  async importGenres() {
    try {
      console.log('📦 Importing genres from TMDb...');
      
      const genres = await this.tmdbService.getGenres();
      
      for (const genre of genres) {
        const [dbGenre, created] = await Genre.findOrCreate({
          where: { tmdb_id: genre.id },
          defaults: {
            name: genre.name,
            tmdb_id: genre.id
          }
        });

        if (created) {
          console.log(`  ✓ Created genre: ${genre.name}`);
        } else {
          console.log(`  - Genre already exists: ${genre.name}`);
        }
      }

      console.log(`✅ Genres import completed!\n`);
      return genres.length;
    } catch (error) {
      console.error('❌ Error importing genres:', error.message);
      throw error;
    }
  }

  /**
   * Importar una película específica con todos sus datos
   */
  async importMovie(tmdbMovieId) {
    try {
      // Verificar si ya existe
      const existingMovie = await Movie.findOne({
        where: { tmdb_id: tmdbMovieId }
      });

      if (existingMovie) {
        console.log(`  - Movie already exists: ${existingMovie.title}`);
        return existingMovie;
      }

      // Obtener detalles completos
      const movieDetails = await this.tmdbService.getMovieDetails(tmdbMovieId);
      const credits = await this.tmdbService.getMovieCredits(tmdbMovieId);

      // Crear película
      const movieData = this.tmdbService.formatMovieData(movieDetails);
      const movie = await Movie.create(movieData);

      console.log(`  ✓ Created movie: ${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'})`);

      // Asociar géneros
      if (movieDetails.genres && movieDetails.genres.length > 0) {
        for (const genre of movieDetails.genres) {
          const dbGenre = await Genre.findOne({ where: { tmdb_id: genre.id } });
          if (dbGenre) {
            await MovieGenre.create({
              movie_id: movie.id,
              genre_id: dbGenre.id
            });
          }
        }
        console.log(`    → Associated ${movieDetails.genres.length} genres`);
      }

      // Importar director y actores principales
      await this.importMovieCredits(movie.id, credits);

      return movie;
    } catch (error) {
      console.error(`  ❌ Error importing movie ${tmdbMovieId}:`, error.message);
      return null;
    }
  }

  /**
   * Importar créditos de una película (cast y crew)
   */
  async importMovieCredits(movieId, credits) {
    try {
      let importedCount = 0;

      // Importar director
      const director = credits.crew.find(member => member.job === 'Director');
      if (director) {
        const person = await this.findOrCreatePerson(director);
        await Credits.create({
          movie_id: movieId,
          person_id: person.id, // Ahora usa person_id que está mapeado a people_id
          role_type: 'director',
          character_name: null
        });
        importedCount++;
      }

      // Importar top 10 actores
      const topActors = credits.cast.slice(0, 10);
      for (const actor of topActors) {
        const person = await this.findOrCreatePerson(actor);
        await Credits.create({
          movie_id: movieId,
          person_id: person.id, // Ahora usa person_id que está mapeado a people_id
          role_type: 'actor',
          character_name: actor.character
        });
        importedCount++;
      }

      console.log(`    → Imported ${importedCount} credits (director + top actors)`);
      return importedCount;
    } catch (error) {
      console.error('    ❌ Error importing credits:', error.message);
      return 0;
    }
  }

  /**
   * Encontrar o crear una persona
   */
  async findOrCreatePerson(tmdbPerson) {
    const [person] = await People.findOrCreate({
      where: { tmdb_id: tmdbPerson.id },
      defaults: this.tmdbService.formatPersonData(tmdbPerson)
    });
    return person;
  }

  /**
   * Importar películas populares
   */
  async importPopularMovies(pages = 1) {
    console.log(`📦 Importing popular movies (${pages} page(s))...\n`);
    
    let totalImported = 0;
    
    for (let page = 1; page <= pages; page++) {
      console.log(`📄 Processing page ${page}/${pages}...`);
      
      const data = await this.tmdbService.getPopularMovies(page);
      
      for (const movie of data.results) {
        const imported = await this.importMovie(movie.id);
        if (imported) totalImported++;
        
        // Pequeña pausa para no saturar la API
        await this.sleep(250);
      }
      
      console.log('');
    }

    console.log(`✅ Popular movies import completed! Total: ${totalImported} movies\n`);
    return totalImported;
  }

  /**
   * Importar películas mejor valoradas
   */
  async importTopRatedMovies(pages = 1) {
    console.log(`📦 Importing top rated movies (${pages} page(s))...\n`);
    
    let totalImported = 0;
    
    for (let page = 1; page <= pages; page++) {
      console.log(`📄 Processing page ${page}/${pages}...`);
      
      const data = await this.tmdbService.getTopRatedMovies(page);
      
      for (const movie of data.results) {
        const imported = await this.importMovie(movie.id);
        if (imported) totalImported++;
        
        await this.sleep(250);
      }
      
      console.log('');
    }

    console.log(`✅ Top rated movies import completed! Total: ${totalImported} movies\n`);
    return totalImported;
  }

  /**
   * Importar películas por género
   */
  async importMoviesByGenre(genreId, pages = 1) {
    console.log(`📦 Importing movies for genre ${genreId} (${pages} page(s))...\n`);
    
    let totalImported = 0;
    
    for (let page = 1; page <= pages; page++) {
      console.log(`📄 Processing page ${page}/${pages}...`);
      
      const data = await this.tmdbService.getMoviesByGenre(genreId, page);
      
      for (const movie of data.results) {
        const imported = await this.importMovie(movie.id);
        if (imported) totalImported++;
        
        await this.sleep(250);
      }
      
      console.log('');
    }

    console.log(`✅ Genre movies import completed! Total: ${totalImported} movies\n`);
    return totalImported;
  }

  /**
   * Importar todo: géneros + películas populares + top rated
   */
  async importAll(moviesPerCategory = 2) {
    console.log('🚀 Starting complete TMDb import...\n');
    console.log('='.repeat(60));
    console.log('\n');

    try {
      // 1. Importar géneros
      await this.importGenres();
      
      // 2. Importar películas populares
      await this.importPopularMovies(moviesPerCategory);
      
      // 3. Importar películas mejor valoradas
      await this.importTopRatedMovies(moviesPerCategory);

      console.log('='.repeat(60));
      console.log('✅ Complete import finished successfully!');
      console.log('='.repeat(60));
    } catch (error) {
      console.error('❌ Import failed:', error.message);
      throw error;
    }
  }

  /**
   * Función auxiliar para pausar ejecución
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Script ejecutable
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Mostrar ayuda si no hay comando o comando inválido
  if (!command || !['genres', 'popular', 'top-rated', 'genre', 'movie', 'all'].includes(command)) {
    console.log('TMDb Importer - Usage:');
    console.log('  node src/scripts/tmdb-importer.js genres');
    console.log('  node src/scripts/tmdb-importer.js popular [pages]');
    console.log('  node src/scripts/tmdb-importer.js top-rated [pages]');
    console.log('  node src/scripts/tmdb-importer.js genre <genreId> [pages]');
    console.log('  node src/scripts/tmdb-importer.js movie <movieId>');
    console.log('  node src/scripts/tmdb-importer.js all [pagesPerCategory]');
    console.log('\nOr use npm scripts:');
    console.log('  npm run tmdb:genres');
    console.log('  npm run tmdb:popular');
    console.log('  npm run tmdb:top-rated');
    console.log('  npm run tmdb:all');
    console.log('\nExamples:');
    console.log('  node src/scripts/tmdb-importer.js all 3');
    console.log('  node src/scripts/tmdb-importer.js popular 5');
    console.log('  node src/scripts/tmdb-importer.js movie 278');
    console.log('\nNote: Make sure TMDB_API_KEY is set in your .env file');
    process.exit(0);
  }

  const importer = new TMDbImporter();
  
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('✓ Database connection established\n');

      switch (command) {
        case 'genres':
          await importer.importGenres();
          break;
          
        case 'popular':
          const popularPages = parseInt(args[1]) || 2;
          await importer.importPopularMovies(popularPages);
          break;
          
        case 'top-rated':
          const topRatedPages = parseInt(args[1]) || 2;
          await importer.importTopRatedMovies(topRatedPages);
          break;
          
        case 'genre':
          const genreId = parseInt(args[1]);
          const genrePages = parseInt(args[2]) || 1;
          if (!genreId) {
            console.error('❌ Please provide a genre ID');
            process.exit(1);
          }
          await importer.importMoviesByGenre(genreId, genrePages);
          break;
          
        case 'movie':
          const movieId = parseInt(args[1]);
          if (!movieId) {
            console.error('❌ Please provide a movie ID');
            process.exit(1);
          }
          await importer.importMovie(movieId);
          break;
          
        case 'all':
          const pagesPerCategory = parseInt(args[1]) || 2;
          await importer.importAll(pagesPerCategory);
          break;
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Fatal error:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = TMDbImporter;
