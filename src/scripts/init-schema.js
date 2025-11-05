require('dotenv').config();
const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const createSchema = async () => {
  const sequelize = new Sequelize(
    dbConfig.development.database,
    dbConfig.development.username,
    dbConfig.development.password,
    {
      host: dbConfig.development.host,
      port: dbConfig.development.port,
      dialect: dbConfig.development.dialect,
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✓ Conexión a la base de datos establecida');

    const schema = dbConfig.development.schema;
    await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
    console.log(`✓ Schema "${schema}" creado/verificado exitosamente`);

  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

createSchema();
