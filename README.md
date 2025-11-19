# Movu General Movie Reviews Service

Servicio para la gestión de películas, reseñas y ratings de la plataforma MovieReviews. Permite crear, consultar, actualizar y eliminar reseñas, así como obtener estadísticas agregadas y gestionar información de películas.

## Autores

- Kevin Johann Jimenez Poveda ([KevP2051](https://github.com/KevP2051))
- Juan Pablo Martinez Gomez ([naju999](https://github.com/naju999))

## Características principales

- CRUD completo de reseñas y ratings
- Gestión de películas y géneros
- Moderación de contenido
- Estadísticas agregadas por película
- Integración con Redis para caché
- Integración con Kafka para eventos
- Sistema de importación de películas desde TMDB
- Circuit breaker para resiliencia
- Métricas de Prometheus
- Testing completo con Jest

## Estructura del proyecto

```
movu-general-movie-reviews-service/
├── package.json
├── .env
├── README.md
├── src/
│   ├── index.js                  # Punto de entrada
│   ├── config/
│   │   ├── database.js           # Configuración de Sequelize
│   │   ├── redis.js              # Configuración de Redis
│   │   └── kafka.js              # Configuración de Kafka
│   ├── controllers/
│   │   ├── movieController.js    # Lógica de películas
│   │   ├── reviewController.js   # Lógica de reseñas
│   │   └── genreController.js    # Lógica de géneros
│   ├── middleware/
│   │   ├── authMiddleware.js     # Validación JWT
│   │   ├── cacheMiddleware.js    # Middleware de caché
│   │   └── errorHandler.js       # Manejo de errores
│   ├── migrations/               # Migraciones de Sequelize
│   ├── models/                   # Modelos de datos
│   │   ├── index.js
│   │   ├── Movie.js
│   │   ├── Review.js
│   │   ├── Genre.js
│   │   └── Person.js
│   ├── repositories/             # Capa de acceso a datos
│   │   ├── movieRepository.js
│   │   ├── reviewRepository.js
│   │   └── genreRepository.js
│   ├── routes/
│   │   ├── movie.routes.js       # Rutas de películas
│   │   ├── review.routes.js      # Rutas de reseñas
│   │   └── genre.routes.js       # Rutas de géneros
│   ├── seeders/                  # Datos iniciales
│   ├── services/
│   │   ├── movieService.js       # Lógica de negocio
│   │   ├── reviewService.js
│   │   ├── cacheService.js       # Gestión de caché
│   │   └── kafkaService.js       # Publicación de eventos
│   ├── scripts/
│   │   ├── populate-database.js  # Script de población de datos
│   │   ├── tmdb-importer.js      # Importador de TMDB
│   │   └── warm-cache.js         # Precalentamiento de caché
│   └── workers/
│       └── reviewWorker.js       # Worker de procesamiento
├── docs/                         # Documentación adicional
└── tests/
    └── unit/
```

## Instalación y ejecución

### Requisitos previos

- Node.js 16 o superior
- PostgreSQL 12 o superior
- Redis 6 o superior
- npm o yarn
- (Opcional) Kafka para eventos
- (Opcional) API Key de TMDB para importar películas

### Pasos de instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/KevP2051/movu-general-movie-reviews-service.git
   cd movu-general-movie-reviews-service
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env`:
   ```env
   # Servidor
   PORT=8082
   NODE_ENV=development
   
   # Base de datos
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=movu_db
   DB_USER=movu
   DB_PASSWORD=movudbpassword
   DB_SCHEMA=reviews_service
   
   # Database URL
   DATABASE_URL=postgresql://movu:movudbpassword@localhost:5432/movu_db
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   CACHE_TTL=3600
   
   # Kafka (opcional)
   KAFKA_BROKER=localhost:9092
   KAFKA_CLIENT_ID=movu-reviews-service
   
   # TMDB API (opcional para importar películas)
   TMDB_API_KEY=tu-api-key
   TMDB_BASE_URL=https://api.themoviedb.org/3
   
   # CORS
   CORS_ORIGIN=http://localhost:8080,http://localhost:3000
   
   # Auth Service
   AUTH_SERVICE_URL=http://localhost:8081
   ```

4. Configura la base de datos:
   ```bash
   # Crear la base de datos (si no existe)
   createdb movu_db -U postgres
   
   # Inicializar schema y ejecutar migraciones
   npm run db:migrate
   
   # (Opcional) Cargar datos iniciales
   npm run db:seed
   ```

5. Inicia Redis:
   ```bash
   # En Windows con WSL o Linux
   redis-server
   
   # O usando Docker
   docker run -d -p 6379:6379 redis:latest
   ```

6. Inicia el servicio:
   ```bash
   npm start
   ```
   
   Para desarrollo con recarga automática:
   ```bash
   npm run dev
   ```

### Scripts disponibles

```bash
# Iniciar servicio en producción
npm start

# Iniciar servicio en desarrollo con nodemon
npm run dev

# Ejecutar pruebas
npm test

# Verificar sintaxis con ESLint
npm run lint

# Corregir problemas de linting automáticamente
npm run lint:fix

# Build completo
npm run build

# Migraciones de base de datos
npm run db:init              # Inicializar schema
npm run db:migrate           # Ejecutar migraciones pendientes
npm run db:migrate:undo      # Revertir última migración
npm run db:migrate:undo:all  # Revertir todas las migraciones

# Seeders
npm run db:seed              # Cargar datos iniciales
npm run db:seed:undo         # Revertir seeders

# Población de datos
npm run db:populate          # Poblar con datos de ejemplo
npm run db:populate:clean    # Limpiar y poblar
npm run db:populate:full     # Poblar con muchos datos

# Importación de TMDB
npm run tmdb:genres          # Importar géneros desde TMDB
npm run tmdb:popular         # Importar películas populares
npm run tmdb:top-rated       # Importar películas mejor valoradas
npm run tmdb:all             # Importar todo desde TMDB

# Caché
npm run cache:warm           # Precalentar caché con datos frecuentes
```

## Migraciones

Este servicio utiliza Sequelize para gestionar el esquema de base de datos. Las migraciones se ejecutan automáticamente con el comando de migración.

### Aplicar migraciones

```bash
# Inicializar schema si no existe
npm run db:init

# Ejecutar todas las migraciones pendientes
npm run db:migrate
```

Las migraciones crean:
1. Schema `reviews_service`
2. Tabla de películas
3. Tabla de géneros
4. Tabla de reseñas
5. Tabla de personas (actores/directores)
6. Tablas de relación (películas-géneros, películas-personas)

### Revertir migraciones

```bash
# Revertir la última migración
npm run db:migrate:undo

# Revertir todas las migraciones
npm run db:migrate:undo:all
```

### Crear nueva migración

```bash
npm run migration:generate -- nombre-de-la-migracion
```

## Importación de datos desde TMDB

El servicio incluye scripts para importar películas desde The Movie Database (TMDB):

1. Obtén una API Key desde [TMDB](https://www.themoviedb.org/settings/api)
2. Añade la key al archivo `.env` como `TMDB_API_KEY`
3. Ejecuta los scripts de importación:

```bash
# Importar géneros
npm run tmdb:genres

# Importar películas populares
npm run tmdb:popular

# Importar películas mejor valoradas
npm run tmdb:top-rated

# Importar todo
npm run tmdb:all
```

## Endpoints principales

### Películas

- `GET /api/movies` - Listar películas (con paginación)
  - Query params: `page`, `limit`, `genre`, `year`, `sort`
- `GET /api/movies/search` - Buscar películas
  - Query params: `q`, `genre`, `year`
- `GET /api/movies/:id` - Obtener película por ID
- `POST /api/movies` - Crear película (admin)
- `PUT /api/movies/:id` - Actualizar película (admin)
- `DELETE /api/movies/:id` - Eliminar película (admin)

### Reseñas

- `GET /api/reviews` - Listar todas las reseñas
- `GET /api/reviews/:id` - Obtener reseña por ID
- `GET /api/reviews/movie/:movieId` - Reseñas de una película
- `GET /api/reviews/movie/:movieId/stats` - Estadísticas de una película
- `POST /api/reviews` - Crear reseña (requiere autenticación)
  ```json
  {
    "movieId": 1,
    "rating": 9,
    "comment": "Excelente película",
    "hasSpoiler": false
  }
  ```
- `PUT /api/reviews/:id` - Actualizar reseña (requiere autenticación)
- `DELETE /api/reviews/:id` - Eliminar reseña (requiere autenticación)

### Géneros

- `GET /api/genres` - Listar todos los géneros
- `GET /api/genres/:id` - Obtener género por ID
- `GET /api/genres/:id/movies` - Películas de un género

## Testing

Para ejecutar las pruebas:
```bash
npm test
```

Las pruebas cubren:
- CRUD de películas y reseñas
- Cálculo de estadísticas
- Integración con Redis
- Middleware de caché
- Validaciones de datos

## Integración con Redis

El servicio utiliza Redis para cachear:
- Listados de películas populares
- Estadísticas de películas
- Detalles de películas frecuentemente consultadas
- Búsquedas recientes

El caché se invalida automáticamente cuando:
- Se crea/actualiza/elimina una reseña
- Se modifica información de una película
- El TTL expira (configurado en `CACHE_TTL`)

Para precalentar el caché:
```bash
npm run cache:warm
```

## Integración con Kafka

El servicio publica eventos a Kafka:
- `review.created` - Nueva reseña creada
- `review.updated` - Reseña actualizada
- `review.deleted` - Reseña eliminada
- `movie.created` - Nueva película añadida
- `movie.stats_updated` - Estadísticas actualizadas

Configura `KAFKA_BROKER` en `.env` para habilitar esta funcionalidad.

## Resiliencia

El servicio implementa patrones de resiliencia:
- **Circuit Breaker**: Usando Opossum para llamadas externas
- **Retry logic**: Reintentos automáticos en fallos transitorios
- **Graceful degradation**: Funcionalidad reducida si Redis no está disponible
- **Health checks**: Endpoint `/health` para monitoreo

## Métricas y monitoreo

El servicio expone métricas de Prometheus en `/metrics`:
- Número de reseñas por película
- Ratings promedio
- Tiempos de respuesta
- Cache hit/miss rate
- Errores de base de datos

## Dependencias principales

### Producción

- **express** - Framework web para Node.js
- **sequelize** - ORM para PostgreSQL
- **pg** - Driver de PostgreSQL
- **ioredis** - Cliente de Redis
- **kafkajs** - Cliente de Kafka
- **axios** - Cliente HTTP para TMDB
- **opossum** - Circuit breaker
- **prom-client** - Métricas de Prometheus
- **dotenv** - Gestión de variables de entorno
- **cors** - Configuración de CORS

### Desarrollo

- **jest** - Framework de testing
- **eslint** - Linter de JavaScript
- **nodemon** - Recarga automática en desarrollo
- **sequelize-cli** - CLI de Sequelize para migraciones

## Seguridad

Implementaciones de seguridad:
- Validación de JWT para operaciones protegidas
- Sanitización de entradas
- Límite de longitud en comentarios
- Detección y marcado de spoilers
- CORS configurado
- Rate limiting (configurado en el gateway)

## Troubleshooting

### Error de conexión a PostgreSQL

Verifica que:
1. PostgreSQL esté ejecutándose
2. Las credenciales en `.env` sean correctas
3. La base de datos `movu_db` exista
4. El schema `reviews_service` esté creado

### Error de conexión a Redis

Si Redis no está disponible:
1. Verifica que Redis esté ejecutándose: `redis-cli ping`
2. Comprueba la configuración en `.env`
3. El servicio funcionará sin caché si Redis falla

### Migraciones fallan

Si las migraciones fallan:
```bash
# Revertir todas
npm run db:migrate:undo:all

# Reinicializar schema
npm run db:init

# Ejecutar migraciones nuevamente
npm run db:migrate
```

### Importación de TMDB falla

Asegúrate de que:
1. La API Key de TMDB sea válida
2. Tengas conexión a internet
3. No hayas excedido el límite de peticiones de TMDB

## Licencia

ISC
