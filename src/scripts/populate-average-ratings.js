const { sequelize } = require('../config/database');
const Movie = require('../models/movie');
const Review = require('../models/review');
const { Op } = require('sequelize');

/**
 * Script para calcular y actualizar el average_rating de todas las películas
 * que tienen reseñas en el sistema.
 */
async function populateAverageRatings() {
  console.log('🎬 Iniciando actualización de calificaciones promedio...\n');
  
  try {
    // Obtener todas las películas con sus reseñas aprobadas
    const stats = await Review.findAll({
      attributes: [
        'movie_id',
        [sequelize.fn('COUNT', sequelize.col('rating')), 'total_ratings'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'average_rating']
      ],
      where: {
        status: 'APPROVED',
        rating: {
          [Op.ne]: null
        }
      },
      group: ['movie_id'],
      raw: true
    });

    console.log(`📊 Encontradas ${stats.length} películas con calificaciones\n`);

    let updated = 0;
    let errors = 0;

    // Actualizar cada película
    for (const stat of stats) {
      try {
        const movieId = stat.movie_id;
        const averageRating = parseFloat(stat.average_rating).toFixed(2);
        const totalRatings = parseInt(stat.total_ratings);

        // Actualizar la película
        const [affectedRows] = await Movie.update(
          { average_rating: averageRating },
          { where: { id: movieId } }
        );

        if (affectedRows > 0) {
          updated++;
          console.log(`✅ Película ${movieId}: ${averageRating} ⭐ (${totalRatings} calificaciones)`);
        } else {
          console.warn(`⚠️ Película ${movieId}: No se encontró en la tabla MOVIES`);
        }

      } catch (error) {
        errors++;
        console.error(`❌ Error procesando película ${stat.movie_id}:`, error.message);
      }
    }

    console.log('\n📈 Resumen de la operación:');
    console.log(`   • Películas procesadas: ${stats.length}`);
    console.log(`   • Actualizadas exitosamente: ${updated}`);
    console.log(`   • Errores: ${errors}`);
    console.log('\n✨ Proceso completado');

  } catch (error) {
    console.error('🚨 Error fatal:', error);
    throw error;
  }
}

// Ejecutar el script si se invoca directamente
if (require.main === module) {
  populateAverageRatings()
    .then(() => {
      console.log('\n👋 Cerrando conexión a la base de datos...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { populateAverageRatings };
