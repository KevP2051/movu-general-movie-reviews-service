#!/usr/bin/env node

/**
 * Script Maestro para Poblar la Base de Datos desde TMDB
 * 
 * Este script:
 * 1. Ejecuta migraciones
 * 2. Importa géneros desde TMDB
 * 3. Importa películas (populares y mejor valoradas)
 * 4. Importa créditos (directores y actores)
 * 5. Verifica los datos
 * 
 * Uso: node src/scripts/populate-database.js [opciones]
 * 
 * Opciones:
 *   --pages <número>     Páginas de películas por categoría (default: 2)
 *   --genres-only        Solo importar géneros
 *   --movies-only        Solo importar películas (requiere géneros existentes)
 *   --credits-only       Solo importar créditos (requiere películas existentes)
 *   --clean              Limpiar datos antes de importar
 */

require('dotenv').config();
const { execSync } = require('child_process');
const TMDbService = require('../services/tmdbService');
const models = require('../models');
const { Genre, Movie, People, Credits, MovieGenre } = models;
const { sequelize } = require('../config/database');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`[PASO ${step}] ${message}`, colors.bright);
  log('='.repeat(60), colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parsear argumentos
const args = process.argv.slice(2);
const options = {
  pages: 2,
  genresOnly: args.includes('--genres-only'),
  moviesOnly: args.includes('--movies-only'),
  creditsOnly: args.includes('--credits-only'),
  clean: args.includes('--clean')
};

const pagesIndex = args.indexOf('--pages');
if (pagesIndex !== -1 && args[pagesIndex + 1]) {
  options.pages = parseInt(args[pagesIndex + 1]) || 2;
}

class DatabasePopulator {
  constructor() {
    this.tmdbService = new TMDbService();
    this.stats = {
      genres: 0,
      movies: 0,
      people: 0,
      credits: 0
    };
  }

  async runMigrations() {
    logStep(1, 'Ejecutando Migraciones');
    try {
      execSync('npm run db:migrate', { stdio: 'inherit' });
      logSuccess('Migraciones ejecutadas correctamente');
    } catch (error) {
      logError('Error ejecutando migraciones');
      throw error;
    }
  }

  async cleanDatabase() {
    logStep('*', 'Limpiando Base de Datos');
    try {
      await Credits.destroy({ where: {} });
      logInfo('Créditos eliminados');
      
      await People.destroy({ where: {} });
      logInfo('Personas eliminadas');
      
      await Movie.destroy({ where: {} });
      logInfo('Películas eliminadas');
      
      await Genre.destroy({ where: {} });
      logInfo('Géneros eliminados');
      
      logSuccess('Base de datos limpiada');
    } catch (error) {
      logError('Error limpiando base de datos: ' + error.message);
      throw error;
    }
  }

  async importGenres() {
    logStep(2, 'Importando Géneros desde TMDB');
    try {
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
          log(`  ✓ ${genre.name}`, colors.green);
          this.stats.genres++;
        } else {
          log(`  - ${genre.name} (ya existe)`, colors.yellow);
        }
      }

      logSuccess(`${this.stats.genres} géneros importados`);
    } catch (error) {
      logError('Error importando géneros: ' + error.message);
      throw error;
    }
  }

  async importMovie(tmdbMovieId) {
    try {
      const existingMovie = await Movie.findOne({ where: { tmdb_id: tmdbMovieId } });
      if (existingMovie) {
        return { movie: existingMovie, created: false };
      }

      const movieDetails = await this.tmdbService.getMovieDetails(tmdbMovieId);
      const movieData = this.tmdbService.formatMovieData(movieDetails);
      const movie = await Movie.create(movieData);

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
      }

      this.stats.movies++;
      return { movie, created: true };
    } catch (error) {
      logError(`Error importando película ${tmdbMovieId}: ${error.message}`);
      return { movie: null, created: false };
    }
  }

  async importMovies() {
    logStep(3, `Importando Películas (${options.pages} páginas por categoría)`);
    
    // Películas populares
    log('\n📦 Películas Populares:', colors.blue);
    for (let page = 1; page <= options.pages; page++) {
      log(`  Página ${page}/${options.pages}...`);
      const data = await this.tmdbService.getPopularMovies(page);
      
      for (const movie of data.results) {
        const { movie: importedMovie, created } = await this.importMovie(movie.id);
        if (created && importedMovie) {
          log(`    ✓ ${importedMovie.title} (${importedMovie.release_date?.substring(0, 4) || 'N/A'})`, colors.green);
        }
        await sleep(250);
      }
    }

    // Películas mejor valoradas
    log('\n📦 Películas Mejor Valoradas:', colors.blue);
    for (let page = 1; page <= options.pages; page++) {
      log(`  Página ${page}/${options.pages}...`);
      const data = await this.tmdbService.getTopRatedMovies(page);
      
      for (const movie of data.results) {
        const { movie: importedMovie, created } = await this.importMovie(movie.id);
        if (created && importedMovie) {
          log(`    ✓ ${importedMovie.title} (${importedMovie.release_date?.substring(0, 4) || 'N/A'})`, colors.green);
        }
        await sleep(250);
      }
    }

    logSuccess(`${this.stats.movies} películas importadas`);
  }

  async importCredits() {
    logStep(4, 'Importando Créditos (Directores y Actores)');
    
    const movies = await Movie.findAll({
      where: {
        tmdb_id: { [require('sequelize').Op.ne]: null }
      }
    });

    log(`\n📊 Procesando ${movies.length} películas...\n`);

    for (const movie of movies) {
      try {
        const credits = await this.tmdbService.getMovieCredits(movie.tmdb_id);
        let movieCredits = 0;

        // Importar director
        const director = credits.crew.find(member => member.job === 'Director');
        if (director && director.id) {
          const personData = this.tmdbService.formatPersonData(director);
          const [person, created] = await People.findOrCreate({
            where: { tmdb_id: director.id },
            defaults: personData
          });

          console.log(`DEBUG Director: ${director.name}, tmdb_id: ${director.id}, person.id: ${person ? person.id : 'NULL'}, created: ${created}`);

          if (person && person.id) {
            await Credits.create({
              movie_id: movie.id,
              person_id: person.id,
              role_type: 'director',
              character_name: null
            });
            movieCredits++;
            this.stats.credits++;
          } else {
            console.log(`ERROR: person.id es ${person.id} para director ${director.name}`);
          }
        }

        // Importar top 10 actores
        const topActors = credits.cast.slice(0, 10);
        for (const actor of topActors) {
          if (actor && actor.id) {
            const personData = this.tmdbService.formatPersonData(actor);
            const [person] = await People.findOrCreate({
              where: { tmdb_id: actor.id },
              defaults: personData
            });

            if (person && person.id) {
              await Credits.create({
                movie_id: movie.id,
                person_id: person.id,
                role_type: 'actor',
                character_name: actor.character || null
              });
              movieCredits++;
              this.stats.credits++;
            }
          }
        }

        log(`  ✓ ${movie.title}: ${movieCredits} créditos`, colors.green);
        await sleep(250);

      } catch (error) {
        logError(`  Error en ${movie.title}: ${error.message}`);
      }
    }

    this.stats.people = await People.count();
    logSuccess(`${this.stats.credits} créditos importados (${this.stats.people} personas)`);
  }

  async verify() {
    logStep(5, 'Verificando Datos Importados');
    
    const stats = {
      genres: await Genre.count(),
      movies: await Movie.count(),
      people: await People.count(),
      credits: await Credits.count()
    };

    log('\n📊 Estadísticas Finales:', colors.cyan);
    log(`   Géneros:    ${stats.genres}`, colors.blue);
    log(`   Películas:  ${stats.movies}`, colors.blue);
    log(`   Personas:   ${stats.people}`, colors.blue);
    log(`   Créditos:   ${stats.credits}`, colors.blue);

    // Mostrar una película de ejemplo
    const movie = await Movie.findOne({
      include: [
        {
          model: Credits,
          as: 'credits',
          include: [{ model: People, as: 'person' }],
          limit: 5
        },
        {
          model: Genre,
          as: 'genres',
          through: { attributes: [] }
        }
      ]
    });

    if (movie) {
      log('\n🎬 Ejemplo de Película:', colors.cyan);
      log(`   Título: ${movie.title}`, colors.blue);
      log(`   Año: ${movie.release_date?.substring(0, 4)}`, colors.blue);
      log(`   Duración: ${movie.runtime} min`, colors.blue);
      log(`   Géneros: ${movie.genres.map(g => g.name).join(', ')}`, colors.blue);
      
      const director = movie.credits.find(c => c.role_type === 'director');
      if (director) {
        log(`   Director: ${director.person.name}`, colors.blue);
      }
      
      const actors = movie.credits.filter(c => c.role_type === 'actor');
      if (actors.length > 0) {
        log(`   Actores: ${actors.map(a => a.person.name).join(', ')}`, colors.blue);
      }
    }

    logSuccess('Verificación completada');
  }

  async run() {
    try {
      log('\n🚀 INICIANDO POBLACIÓN DE BASE DE DATOS', colors.bright);
      log(`📄 Configuración: ${options.pages} páginas por categoría\n`, colors.yellow);

      await sequelize.authenticate();
      logSuccess('Conexión a la base de datos establecida\n');

      // Paso 1: Migraciones
      await this.runMigrations();

      // Limpieza opcional
      if (options.clean) {
        await this.cleanDatabase();
      }

      // Importación según opciones
      if (options.genresOnly) {
        await this.importGenres();
      } else if (options.moviesOnly) {
        await this.importMovies();
      } else if (options.creditsOnly) {
        await this.importCredits();
      } else {
        // Importación completa
        await this.importGenres();
        await this.importMovies();
        await this.importCredits();
      }

      // Paso 5: Verificación
      await this.verify();

      log('\n' + '='.repeat(60), colors.cyan);
      logSuccess('¡POBLACIÓN COMPLETADA EXITOSAMENTE!');
      log('='.repeat(60) + '\n', colors.cyan);

      process.exit(0);
    } catch (error) {
      log('\n' + '='.repeat(60), colors.red);
      logError('ERROR FATAL: ' + error.message);
      log('='.repeat(60) + '\n', colors.red);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// Mostrar ayuda si se solicita
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🎬 Script de Población de Base de Datos desde TMDB

Uso: node src/scripts/populate-database.js [opciones]

Opciones:
  --pages <número>     Número de páginas por categoría (default: 2)
                       Cada página = ~20 películas
  
  --genres-only        Solo importar géneros
  --movies-only        Solo importar películas (requiere géneros)
  --credits-only       Solo importar créditos (requiere películas)
  
  --clean              Limpiar base de datos antes de importar
  --help, -h           Mostrar esta ayuda

Ejemplos:
  # Población completa con 2 páginas (default, ~80 películas)
  node src/scripts/populate-database.js

  # Población completa con 5 páginas (~200 películas)
  node src/scripts/populate-database.js --pages 5

  # Limpiar y re-poblar desde cero
  node src/scripts/populate-database.js --clean --pages 3

  # Solo géneros
  node src/scripts/populate-database.js --genres-only

  # Solo películas (asumiendo que ya tienes géneros)
  node src/scripts/populate-database.js --movies-only --pages 10

  # Solo créditos (re-importar créditos de películas existentes)
  node src/scripts/populate-database.js --credits-only

Nota: Asegúrate de tener TMDB_API_KEY en tu archivo .env
  `);
  process.exit(0);
}

// Ejecutar
const populator = new DatabasePopulator();
populator.run();
