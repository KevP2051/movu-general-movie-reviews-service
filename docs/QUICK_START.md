# 🚀 Guía Rápida de Inicio

Esta guía te ayudará a poner en marcha el proyecto en 5 minutos.

## 📋 Pasos Rápidos

### 1. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=movu_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SCHEMA=general_movie_reviews_service

# Server
PORT=3001
NODE_ENV=development

# TMDb API (obtén tu key en https://www.themoviedb.org/settings/api)
TMDB_API_KEY=tu_api_key_aqui
```

### 2. Iniciar PostgreSQL con Docker

```powershell
docker run --name movu-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=movu_db -p 5432:5432 -d postgres:14
```

### 3. Ejecutar Migraciones

```powershell
npm run db:migrate
```

### 4. Importar Datos de TMDb (Opcional)

**Opción A - Setup Completo (recomendado):**
```powershell
npm run tmdb:all
```
Esto importará géneros + ~80 películas con todos sus datos.

**Opción B - Solo algunas películas:**
```powershell
# Primero importar géneros
npm run tmdb:genres

# Luego algunas películas específicas
node src/scripts/tmdb-importer.js movie 278    # The Shawshank Redemption
node src/scripts/tmdb-importer.js movie 27205  # Inception
node src/scripts/tmdb-importer.js movie 155    # The Dark Knight
```

### 5. Iniciar el Servidor

```powershell
npm run dev
```

El servidor estará disponible en: `http://localhost:3001`

---

## ✅ Verificar que Funciona

### 1. Health Check

```powershell
curl http://localhost:3001/api/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Movie Reviews Service is running",
  "timestamp": "2025-11-07T..."
}
```

### 2. Ver Películas Importadas

```powershell
curl http://localhost:3001/api/movies
```

### 3. Buscar una Película

```powershell
curl http://localhost:3001/api/movies/search?q=inception
```

### 4. Ver Géneros

```powershell
curl http://localhost:3001/api/genres
```

### 5. Crear una Reseña

```powershell
curl -X POST http://localhost:3001/api/reviews -H "Content-Type: application/json" -d "{\"movie_id\":1,\"user_id\":123,\"rating\":9,\"comment\":\"Great movie!\"}"
```

---

## 🎯 Comandos Útiles

```powershell
# Ver películas en la base de datos
docker exec -it movu-postgres psql -U postgres -d movu_db -c "SELECT COUNT(*) FROM general_movie_reviews_service.movies;"

# Ver géneros
docker exec -it movu-postgres psql -U postgres -d movu_db -c "SELECT * FROM general_movie_reviews_service.genres;"

# Reiniciar base de datos
npm run db:migrate:undo:all
npm run db:migrate
npm run tmdb:all
```

---

## 📊 Ejemplo de Flujo Completo

```powershell
# 1. Configurar .env (ver arriba)

# 2. Iniciar Docker
docker run --name movu-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=movu_db -p 5432:5432 -d postgres:14

# 3. Instalar dependencias (si no lo has hecho)
npm install

# 4. Ejecutar migraciones
npm run db:migrate

# 5. Importar datos
npm run tmdb:all

# 6. Iniciar servidor
npm run dev

# 7. Probar API
curl http://localhost:3001/api/movies
```

---

## 🐛 Problemas Comunes

### "TMDB_API_KEY is not defined"
- Verifica que tu `.env` tenga la variable `TMDB_API_KEY`
- Obtén tu API key en: https://www.themoviedb.org/settings/api

### "Connection refused" al ejecutar migraciones
- Verifica que Docker esté corriendo: `docker ps`
- Verifica que PostgreSQL esté corriendo: `docker logs movu-postgres`

### "Schema does not exist"
- Las migraciones crean el esquema automáticamente
- Ejecuta: `npm run db:migrate`

### Puerto 3001 en uso
- Cambia el puerto en `.env`: `PORT=3002`
- O detén el proceso que usa el puerto 3001

---

## 🎉 ¡Listo!

Ahora puedes:
- ✅ Buscar películas por título, género, director, año
- ✅ Ver detalles completos de películas con cast
- ✅ Crear reseñas con calificaciones
- ✅ Ver estadísticas de películas
- ✅ Gestionar géneros y personas

**Siguiente paso:** Lee la [documentación completa de endpoints](ENDPOINTS.md) para ver todas las funcionalidades disponibles.
