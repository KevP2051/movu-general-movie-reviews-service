require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Review = require('../src/models/review');

async function checkReviews() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a BD establecida\n');

    // 1. Contar todas las reviews por estado
    const allReviews = await Review.findAll({
      attributes: [
        'status',
        [Review.sequelize.fn('COUNT', Review.sequelize.col('review_id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    console.log('📊 RESUMEN DE REVIEWS POR ESTADO:');
    console.log('─'.repeat(50));
    allReviews.forEach(r => {
      console.log(`  ${r.status.padEnd(10)} : ${r.count} reviews`);
    });

    // 2. Mostrar las últimas 10 reviews
    const latestReviews = await Review.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      attributes: ['review_id', 'movie_id', 'user_id', 'rating', 'status', 'createdAt'],
      raw: true
    });

    console.log('\n📝 ÚLTIMAS 10 REVIEWS CREADAS:');
    console.log('─'.repeat(80));
    console.log('ID'.padEnd(8) + 'Movie'.padEnd(10) + 'User'.padEnd(10) + 'Rating'.padEnd(10) + 'Status'.padEnd(12) + 'Fecha');
    console.log('─'.repeat(80));
    latestReviews.forEach(r => {
      const fecha = new Date(r.createdAt).toLocaleString();
      console.log(
        String(r.review_id).padEnd(8) +
        String(r.movie_id).padEnd(10) +
        String(r.user_id).padEnd(10) +
        String(r.rating).padEnd(10) +
        r.status.padEnd(12) +
        fecha
      );
    });

    // 3. Stats por película
    const movieStats = await Review.findAll({
      where: { status: 'APPROVED' },
      attributes: [
        'movie_id',
        [Review.sequelize.fn('COUNT', Review.sequelize.col('review_id')), 'total'],
        [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'avg_rating']
      ],
      group: ['movie_id'],
      order: [[Review.sequelize.fn('COUNT', Review.sequelize.col('review_id')), 'DESC']],
      limit: 5,
      raw: true
    });

    console.log('\n🎬 TOP 5 PELÍCULAS CON MÁS REVIEWS (APPROVED):');
    console.log('─'.repeat(60));
    console.log('Movie ID'.padEnd(15) + 'Total Reviews'.padEnd(20) + 'Rating Promedio');
    console.log('─'.repeat(60));
    movieStats.forEach(s => {
      const avgRating = parseFloat(s.avg_rating).toFixed(2);
      console.log(
        String(s.movie_id).padEnd(15) +
        String(s.total).padEnd(20) +
        avgRating
      );
    });

    console.log('\n✅ Diagnóstico completado');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkReviews();
