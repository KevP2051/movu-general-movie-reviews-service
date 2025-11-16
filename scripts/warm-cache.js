/**
 * Script para precalentar el caché de Redis
 * Cachea todos los géneros, películas por género y detalles de cada película
 */

const axios = require('axios');

const API_BASE = 'http://localhost:8082/api';
const DELAY_MS = 100; // Delay entre requests para no sobrecargar

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function warmCache() {
  console.log('🔥 Iniciando precalentamiento de caché...\n');
  
  let totalMovies = 0;
  let cachedMovies = 0;
  
  try {
    // 1. Cachear géneros
    console.log('📚 1/3 - Cacheando géneros...');
    const genresRes = await axios.get(`${API_BASE}/genres`);
    const genres = genresRes.data.data;
    console.log(`   ✅ ${genres.length} géneros cacheados\n`);
    
    // 2. Cachear películas por género y recolectar IDs
    console.log('🎬 2/3 - Cacheando películas por género...');
    const movieIds = new Set();
    
    for (const genre of genres) {
      await sleep(DELAY_MS);
      
      try {
        const moviesRes = await axios.get(`${API_BASE}/movies/genre/${genre.id}?page=1&limit=200`);
        const movies = moviesRes.data.data;
        
        console.log(`   • ${genre.name}: ${movies.length} películas`);
        
        // Recolectar IDs únicos
        movies.forEach(movie => movieIds.add(movie.id));
        totalMovies += movies.length;
      } catch (error) {
        console.error(`   ❌ Error en género ${genre.name}:`, error.message);
      }
    }
    
    console.log(`\n   ✅ Total: ${totalMovies} películas en ${genres.length} géneros`);
    console.log(`   📊 IDs únicos: ${movieIds.size} películas\n`);
    
    // 3. Cachear detalles de cada película individual
    console.log('🎯 3/3 - Cacheando detalles de películas...');
    const movieIdsArray = Array.from(movieIds);
    
    for (let i = 0; i < movieIdsArray.length; i++) {
      const movieId = movieIdsArray[i];
      await sleep(DELAY_MS);
      
      try {
        await axios.get(`${API_BASE}/movies/${movieId}`);
        cachedMovies++;
        
        if ((i + 1) % 10 === 0 || (i + 1) === movieIdsArray.length) {
          process.stdout.write(`\r   ⏳ Progreso: ${i + 1}/${movieIdsArray.length} películas...`);
        }
      } catch (error) {
        console.error(`\n   ⚠️ Error en película ${movieId}:`, error.message);
      }
    }
    
    console.log(`\n   ✅ ${cachedMovies} detalles de películas cacheados\n`);
    
    // Resumen final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ CACHÉ PRECALENTADO EXITOSAMENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Géneros: ${genres.length}`);
    console.log(`🎬 Películas (listas): ${totalMovies}`);
    console.log(`🎯 Detalles individuales: ${cachedMovies}`);
    console.log('\n💡 Ahora puedes apagar la BD y todo debería funcionar desde Redis');
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('⚠️ Asegúrate de que:');
    console.error('   1. El servidor esté corriendo en localhost:8082');
    console.error('   2. PostgreSQL esté encendido');
    console.error('   3. Redis esté funcionando\n');
    process.exit(1);
  }
}

// Ejecutar
warmCache().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
