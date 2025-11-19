require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Review = require('../src/models/review');

async function approvePendingReviews() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a BD establecida\n');

    // Contar reviews PENDING antes
    const pendingCount = await Review.count({
      where: { status: 'PENDING' }
    });

    console.log(`📊 Reviews PENDING encontradas: ${pendingCount}`);

    if (pendingCount === 0) {
      console.log('✅ No hay reviews pendientes de aprobar');
      process.exit(0);
    }

    // Mostrar las reviews que se van a aprobar
    const pendingReviews = await Review.findAll({
      where: { status: 'PENDING' },
      attributes: ['review_id', 'movie_id', 'user_id', 'rating', 'createdAt'],
      raw: true
    });

    console.log('\n📝 Reviews que serán aprobadas:');
    console.log('─'.repeat(80));
    console.log('ID'.padEnd(8) + 'Movie'.padEnd(10) + 'User'.padEnd(10) + 'Rating'.padEnd(10) + 'Fecha');
    console.log('─'.repeat(80));
    pendingReviews.forEach(r => {
      const fecha = new Date(r.createdAt).toLocaleDateString();
      console.log(
        String(r.review_id).padEnd(8) +
        String(r.movie_id).padEnd(10) +
        String(r.user_id).padEnd(10) +
        String(r.rating).padEnd(10) +
        fecha
      );
    });

    // Aprobar todas las reviews PENDING
    console.log('\n🔄 Aprobando reviews...');
    const result = await Review.update(
      { status: 'APPROVED' },
      { where: { status: 'PENDING' } }
    );

    console.log(`\n✅ ${result[0]} reviews aprobadas exitosamente`);
    console.log('\n💡 Ahora reinicia el microservicio para que el caché se actualice correctamente.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Confirmar antes de ejecutar
console.log('⚠️  Este script aprobará TODAS las reviews con estado PENDING');
console.log('¿Estás seguro? (Ctrl+C para cancelar, Enter para continuar)\n');

process.stdin.once('data', () => {
  approvePendingReviews();
});
