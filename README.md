# Movu General Movie Reviews Service

Microservicio de reseñas de películas para la plataforma Movu. Proporciona una API REST completa para gestionar películas, reseñas, géneros y personas relacionadas con el cine.

## Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Docker Setup (Recomendado)](#docker-setup-recomendado)
- [Ejecución](#ejecución)
- [API Endpoints](#api-endpoints)
- [Poblar Base de Datos desde TMDb](#poblar-base-de-datos-desde-tmdb)
- [Base de Datos](#base-de-datos)
- [Modelos](#modelos)
- [Documentación](#documentación)

---

## Características

- **Gestión de Películas**: CRUD completo, búsqueda, filtrado por género, director, año
- **Sistema de Reseñas**: Calificaciones, comentarios, moderación (aprobar/rechazar)
- **Gestión de Personas**: Actores, directores, crew
- **Géneros**: Categorización de películas
- **Estadísticas**: Ratings promedio, distribución de calificaciones
- **Búsqueda Avanzada**: Por título, director, año, género
- **Importación TMDb**: Alimentar la BD automáticamente desde TMDb API
- **Paginación**: En todos los endpoints que retornan listas
- **Validación**: Middleware de validación de datos
- **Sistema de Resiliencia**: Alta disponibilidad con Redis y Kafka
  - **Redis Cache**: Lecturas rápidas cuando BD está caída
  - **Kafka Queue**: Escrituras encoladas cuando BD está caída
  - **Circuit Breaker**: Detección automática de fallos
  - **Auto-recovery**: Worker procesa cola cuando BD se recupera

---

## Requisitos

- **Node.js**: v16 o superior
- **PostgreSQL**: v12 o superior
- **Redis**: v6 o superior (para sistema de resiliencia)
- **Kafka**: v2.8 o superior (para sistema de resiliencia)
- **npm**: v8 o superior
- **TMDb API Key**: Para importar datos (opcional)

---

## Instalación

```powershell
# Clonar el repositorio
git clone <repo-url>
cd movu-general-movie-reviews-service

# Instalar dependencias
npm install
```

---

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```powershell
cp .env.example .env
```

Configura las variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=movu_db
DB_USER=postgres
DB_PASSWORD=
DB_SCHEMA=general_movie_reviews_service

# Server
PORT=3001
NODE_ENV=development

# TMDb API (opcional, para importar datos)
TMDB_API_KEY=

# Redis (Sistema de Resiliencia)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Kafka (Sistema de Resiliencia)
KAFKA_BROKERS=localhost:9092
```

---

## 🛡️ Sistema de Resiliencia (Redis + Kafka)

El servicio implementa un sistema robusto de **alta disponibilidad** que permite seguir funcionando aunque PostgreSQL esté caída.

### Probar el Sistema de Resiliencia

```powershell
# Verificar que Redis y Kafka están funcionando
npm run test:resilience
```

Este comando ejecuta una demo completa que:
- ✅ Prueba conexión Redis
- ✅ Prueba conexión Kafka
- ✅ Demuestra Circuit Breaker
- ✅ Explica toda la arquitectura

### Cómo Funciona

**Cuando la BD está disponible:**
- Operaciones normales
- Datos se cachean en Redis para lecturas rápidas

**Cuando la BD está CAÍDA:**
- **Lecturas**: Se sirven desde Redis (caché)
- **Escrituras**: Se encolan en Kafka
- Usuario recibe respuesta inmediata

**Cuando la BD se recupera:**
- Worker procesa automáticamente la cola de Kafka
- Sincroniza todas las operaciones pendientes

### Monitoreo

```powershell
# Ver estado del sistema de resiliencia
curl http://localhost:3001/api/resilience/status
```

### Documentación Completa

- **[docs/RESILIENCE.md](docs/RESILIENCE.md)**: Arquitectura y testing
- **[docs/EXPLICACION_REDIS_KAFKA.md](docs/EXPLICACION_REDIS_KAFKA.md)**: Explicación detallada de Redis, Kafka y TTLs
- **[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)**: Estado actual de implementación

### 2. Base de Datos

#### Opción A: Con Docker Compose (Recomendado)

Ver la sección [Docker Setup](#docker-setup-recomendado) más abajo para setup completo con un solo comando.

#### Opción B: Docker Manual

```powershell
docker run --name movu-postgres -e POSTGRES_PASSWORD=<tu_password> -e POSTGRES_DB=movu_db -p 5432:5432 -d postgres:14
```

#### Ejecutar Migraciones

```powershell
npm run db:migrate
```

Esto creará automáticamente:
- El esquema `general_movie_reviews_service`
- Todas las tablas necesarias

---

## Docker Setup (Recomendado)

La forma más rápida de tener todo funcionando es usar Docker Compose, que levantará:
- PostgreSQL con el esquema creado
- Migraciones ejecutadas automáticamente
- Opcionalmente, datos pre-cargados de TMDB

### Inicio Rápido con Docker

```powershell
# 1. Configurar variables de entorno
cp .env.docker .env

# Editar .env con tus valores:
# - DB_PASSWORD=tu_password
# - TMDB_API_KEY=tu_api_key (si quieres datos)
# - POPULATE_DATABASE=true (para pre-cargar datos)

# 2. Levantar todo con un solo comando
docker-compose up -d

# 3. Verificar que está funcionando
docker-compose logs -f
```

Esto creará automáticamente:
- Base de datos PostgreSQL
- Esquema `general_movie_reviews_service`
- Todas las tablas (via migraciones)
- Datos de TMDB (si `POPULATE_DATABASE=true`)

### Comandos Docker Útiles

```powershell
# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Reiniciar desde cero (borra todos los datos)
docker-compose down -v
docker-compose up -d

# Ejecutar migraciones manualmente
docker-compose exec db-setup npm run db:migrate

# Poblar datos manualmente
docker-compose exec db-setup npm run db:populate

# Validar que todo está configurado correctamente
npm run db:validate

# Generar dump SQL para usar en otro repositorio
npm run db:dump
```

### Usar en Otro Repositorio

Si quieres levantar la base de datos en un repositorio separado:

**Documentación detallada:**
- [docker/STEP_BY_STEP.md](docker/STEP_BY_STEP.md) - Instrucciones paso a paso
- [docker/EXTERNAL_REPO_SETUP.md](docker/EXTERNAL_REPO_SETUP.md) - 4 opciones diferentes
- [docker/README.md](docker/README.md) - Documentación completa

**Guía rápida:**
1. Genera el dump: `npm run db:dump`
2. Copia archivos a tu otro repo (ver guía)
3. Ejecuta: `docker-compose up -d`

---

## Ejecución

### Modo Desarrollo

```powershell
npm run dev
```

El servidor se iniciará en `http://localhost:3001`

### Modo Producción

```powershell
npm start
```

---

## API Endpoints

El servidor expone los siguientes endpoints:

### Movies
- `GET /api/movies` - Listar películas (con paginación)
- `GET /api/movies/:id` - Obtener película por ID
- `GET /api/movies/search?q=titulo` - Buscar películas
- `GET /api/movies/genre/:genreId` - Películas por género
- `GET /api/movies/director?director=nombre` - Películas por director
- `GET /api/movies/year/:year` - Películas por año
- `POST /api/movies` - Crear película
- `PUT /api/movies/:id` - Actualizar película
- `DELETE /api/movies/:id` - Eliminar película

### Reviews
- `GET /api/reviews` - Listar reseñas
- `GET /api/reviews/movie/:movieId` - Reseñas de una película
- `GET /api/reviews/movie/:movieId/stats` - Estadísticas de reseñas
- `GET /api/reviews/user/:userId` - Reseñas de un usuario
- `GET /api/reviews/rating?min=8&max=10` - Reseñas por rating
- `POST /api/reviews` - Crear reseña
- `PUT /api/reviews/:id` - Actualizar reseña
- `DELETE /api/reviews/:id` - Eliminar reseña
- `PATCH /api/reviews/:id/approve` - Aprobar reseña
- `PATCH /api/reviews/:id/reject` - Rechazar reseña

### Genres
- `GET /api/genres` - Listar géneros
- `GET /api/genres/:id` - Obtener género por ID
- `POST /api/genres` - Crear género
- `PUT /api/genres/:id` - Actualizar género
- `DELETE /api/genres/:id` - Eliminar género

### People
- `GET /api/people` - Listar personas
- `GET /api/people/search?q=nombre` - Buscar personas
- `GET /api/people/:id` - Obtener persona por ID
- `GET /api/people/:id/movies` - Películas de una persona
- `POST /api/people` - Crear persona
- `PUT /api/people/:id` - Actualizar persona
- `DELETE /api/people/:id` - Eliminar persona

### Health Check
- `GET /api/health` - Verificar estado del servicio

**Ver documentación completa:** [docs/ENDPOINTS.md](docs/ENDPOINTS.md)

---

## Poblar Base de Datos desde TMDb

El proyecto incluye un **script maestro** que pobla automáticamente toda la base de datos desde The Movie Database (TMDb) con un solo comando.

### Setup Rápido (Recomendado)

```powershell
# 1. Configurar TMDB_API_KEY en .env

# 2. Poblar la base de datos completa con un solo comando
npm run db:populate
```

Este comando ejecutará:
1. Migraciones de base de datos
2. Importación de géneros (19 géneros en español)
3. Importación de películas (populares + top rated)
4. Importación de créditos (directores + actores)
5. Verificación de datos

**Resultado esperado:** ~80-100 películas con géneros, directores y actores completos.

### Comandos Disponibles

```powershell
# Poblar todo desde cero (limpia datos existentes)
npm run db:populate:clean

# Poblar todo (más páginas de películas)
npm run db:populate:full

# Solo importar géneros
npm run db:populate -- --genres-only

# Solo importar películas (sin créditos)
npm run db:populate -- --movies-only --pages 10

# Solo importar créditos
npm run db:populate -- --credits-only
```

### Opciones Avanzadas

```powershell
# Importar 20 páginas de películas (400 películas)
npm run db:populate -- --pages 20

# Limpiar y poblar con 10 páginas
npm run db:populate -- --clean --pages 10

# Solo géneros con limpieza
npm run db:populate -- --clean --genres-only
```

### Documentación Completa

Para más detalles sobre:
- Arquitectura del script
- Datos importados
- Solución de problemas
- Uso de imágenes de TMDb

**Ver guía completa:** [docs/DATABASE_POPULATION.md](docs/DATABASE_POPULATION.md)

### Scripts Individuales (Uso Avanzado)

Si necesitas importar componentes específicos manualmente:

```powershell
# Importar géneros
npm run tmdb:genres

# Importar películas populares
npm run tmdb:popular

# Importar películas mejor valoradas
npm run tmdb:top-rated

# Importar una película específica por ID
npm run tmdb:movie 278  # The Shawshank Redemption
```

**Ver más opciones:** [docs/TMDB_IMPORT.md](docs/TMDB_IMPORT.md)

---

## Base de Datos

### Esquema

Todas las tablas se crean en el esquema `general_movie_reviews_service`.

### Comandos de Migraciones

```powershell
# Ejecutar migraciones
npm run db:migrate

# Revertir última migración
npm run db:migrate:undo

# Revertir todas las migraciones
npm run db:migrate:undo:all

# Crear nueva migración
npm run migration:generate -- nombre-de-la-migracion
```

### Comandos de Seeders

```powershell
# Ejecutar seeders
npm run db:seed

# Revertir seeders
npm run db:seed:undo

# Crear nuevo seeder
npm run seed:generate -- nombre-del-seeder
```

---

## Modelos

El proyecto incluye los siguientes modelos Sequelize:

### Movie
Películas con información completa (título, sinopsis, fecha de estreno, etc.)

### Review
Reseñas de usuarios con calificaciones (1-10) y comentarios.

**Estados:**
- `pending`: Esperando moderación
- `approved`: Aprobada
- `rejected`: Rechazada

### Genre
Géneros de películas (Action, Drama, Comedy, etc.)

### MovieGenre
Tabla intermedia para relación many-to-many entre películas y géneros.

### People
Personas relacionadas con películas (actores, directores, etc.)

### Credits
Créditos de películas con rol (`actor`, `director`, `producer`, etc.)

---

## Documentación

- **[docker/README.md](docker/README.md)**: Guía completa de Docker Compose
- **[docker/EXTERNAL_REPO_SETUP.md](docker/EXTERNAL_REPO_SETUP.md)**: Cómo usar la base de datos en otro repositorio
- **[DATABASE_POPULATION.md](docs/DATABASE_POPULATION.md)**: Guía completa de población de base de datos
- **[TMDB_IMPORT.md](docs/TMDB_IMPORT.md)**: Guía de importación manual avanzada desde TMDb
- **[ENDPOINTS.md](docs/ENDPOINTS.md)**: Documentación completa de la API con ejemplos

---

## Tecnologías

- **Express**: Framework web
- **Sequelize**: ORM para PostgreSQL
- **PostgreSQL**: Base de datos
- **Docker**: Containerización
- **Axios**: Cliente HTTP para TMDb API
- **dotenv**: Gestión de variables de entorno
- **CORS**: Manejo de CORS

---

## Estructura del Proyecto

```
movu-general-movie-reviews-service/
├── src/
│   ├── config/           # Configuración de DB y Sequelize CLI
│   ├── controllers/      # Controladores HTTP
│   ├── middleware/       # Middleware de validación
│   ├── migrations/       # Migraciones de base de datos
│   ├── models/           # Modelos Sequelize
│   ├── repositories/     # Capa de acceso a datos
│   ├── routes/           # Definición de rutas
│   ├── scripts/          # Scripts de utilidad (importador TMDb)
│   ├── services/         # Lógica de negocio
│   └── index.js          # Punto de entrada de la aplicación
├── docs/                 # Documentación
├── .env.example          # Ejemplo de variables de entorno
├── .sequelizerc          # Configuración de Sequelize CLI
├── package.json
└── README.md
```

---

## Notas de Seguridad

- **user_id en Reviews**: Es una referencia externa al servicio de autenticación (no hay FK)
- **Autenticación**: Actualmente no implementada (próxima versión)
- **CORS**: Habilitado para todos los orígenes en desarrollo

---

## Solución de Problemas

### Error: "Schema does not exist"

```powershell
# El script de migraciones crea el esquema automáticamente
npm run db:migrate
```

### Error: "Connection refused"

Verifica que PostgreSQL esté corriendo:
```powershell
docker ps  # Si usas Docker
```

### Películas duplicadas en TMDb import

El importador omite automáticamente películas ya existentes (por `tmdb_id`).

---

## License

ISC

---

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.
