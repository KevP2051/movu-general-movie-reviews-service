/**
 * Configuración de CORS para permitir peticiones del API Gateway
 */
const corsOptions = {
  // Permitir peticiones desde el gateway
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  
  // Permitir cookies y credenciales
  credentials: true,
  
  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  
  // Headers permitidos (incluyendo los que envía el gateway)
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-user-id',        // Headers del gateway
    'x-user-email',
    'x-user-role',
    'x-gateway',
    'x-correlation-id'
  ],
  
  // Headers expuestos al cliente
  exposedHeaders: [
    'x-correlation-id',
    'x-total-count',
    'x-page',
    'x-per-page'
  ],
  
  // Caché de preflight requests (en segundos)
  maxAge: 86400 // 24 horas
};

module.exports = corsOptions;
