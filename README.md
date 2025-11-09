# Movu General Movie Reviews Service

Microservicio de reseñas de películas para la plataforma Movu. Proporciona una API REST completa para gestionar películas, reseñas, géneros y personas relacionadas con el cine.

## 📋 Tabla de Contenidos

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [API Endpoints](#api-endpoints)
- [Importar Datos desde TMDb](#importar-datos-desde-tmdb)
- [Base de Datos](#base-de-datos)
- [Modelos](#modelos)
- [Documentación](#documentación)

---

## ✨ Características

- 🎬 **Gestión de Películas**: CRUD completo, búsqueda, filtrado por género, director, año
- ⭐ **Sistema de Reseñas**: Calificaciones, comentarios, moderación (aprobar/rechazar)
- 🎭 **Gestión de Personas**: Actores, directores, crew
- 🏷️ **Géneros**: Categorización de películas
- 📊 **Estadísticas**: Ratings promedio, distribución de calificaciones
- 🔍 **Búsqueda Avanzada**: Por título, director, año, género
- 📥 **Importación TMDb**: Alimentar la BD automáticamente desde TMDb API
- 🔄 **Paginación**: En todos los endpoints que retornan listas
- ✅ **Validación**: Middleware de validación de datos

---

## 🔧 Requisitos

- **Node.js**: v16 o superior
- **PostgreSQL**: v12 o superior
- **npm**: v8 o superior
- **TMDb API Key**: Para importar datos (opcional)

---

## 📦 Instalación

```powershell
# Clonar el repositorio
git clone <repo-url>
cd movu-general-movie-reviews-service

# Instalar dependencias
npm install
```

---

## ⚙️ Configuración

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
DB_PASSWORD=your_password
DB_SCHEMA=general_movie_reviews_service

# Server
PORT=3001
NODE_ENV=development

# TMDb API (opcional, para importar datos)
TMDB_API_KEY=your_tmdb_api_key_here
```

### 2. Base de Datos

#### Con Docker (Recomendado)

```powershell
docker run --name movu-postgres -e POSTGRES_PASSWORD=your_password -e POSTGRES_DB=movu_db -p 5432:5432 -d postgres:14
```

#### Ejecutar Migraciones

```powershell
npm run db:migrate
```

Esto creará automáticamente:
- El esquema `general_movie_reviews_service`
- Todas las tablas necesarias

---

## 🚀 Ejecución

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

## 📡 API Endpoints

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

## 📥 Importar Datos desde TMDb

El proyecto incluye un importador automático desde The Movie Database (TMDb).

### Setup Rápido

```powershell
# 1. Configurar TMDB_API_KEY en .env

# 2. Importar todo (géneros + películas populares + top rated)
npm run tmdb:all
```

### Comandos Disponibles

```powershell
# Importar géneros
npm run tmdb:genres

# Importar películas populares (2 páginas = 40 películas)
npm run tmdb:popular

# Importar películas mejor valoradas
npm run tmdb:top-rated

# Importar una película específica por ID
npm run tmdb:movie 278  # The Shawshank Redemption
```

### Comandos Avanzados

```powershell
# Importar 10 páginas de películas populares (200 películas)
node src/scripts/tmdb-importer.js popular 10

# Importar películas de ciencia ficción
node src/scripts/tmdb-importer.js genre 878 5

# Importar todo con 10 páginas por categoría
node src/scripts/tmdb-importer.js all 10
```

**Ver guía completa:** [docs/TMDB_IMPORT.md](docs/TMDB_IMPORT.md)

---

## 🗄️ Base de Datos

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

## 📊 Modelos

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

## 📚 Documentación

- **[ENDPOINTS.md](docs/ENDPOINTS.md)**: Documentación completa de la API con ejemplos
- **[TMDB_IMPORT.md](docs/TMDB_IMPORT.md)**: Guía para importar datos desde TMDb

---

## 🛠️ Tecnologías

- **Express**: Framework web
- **Sequelize**: ORM para PostgreSQL
- **PostgreSQL**: Base de datos
- **Axios**: Cliente HTTP para TMDb API
- **dotenv**: Gestión de variables de entorno
- **CORS**: Manejo de CORS

---

## 📁 Estructura del Proyecto

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

## 🔐 Notas de Seguridad

- **user_id en Reviews**: Es una referencia externa al servicio de autenticación (no hay FK)
- **Autenticación**: Actualmente no implementada (próxima versión)
- **CORS**: Habilitado para todos los orígenes en desarrollo

---

## 🐛 Solución de Problemas

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

## 📝 License

ISC

---

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.
