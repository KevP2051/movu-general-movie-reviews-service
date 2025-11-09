# Importar Datos desde TMDb

Esta guía explica cómo alimentar la base de datos con películas, géneros y personas desde la API de [The Movie Database (TMDb)](https://www.themoviedb.org/).

## 📋 Tabla de Contenidos
1. [Configuración Inicial](#configuración-inicial)
2. [Uso del Importador](#uso-del-importador)
3. [Comandos Disponibles](#comandos-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Estructura de Datos Importados](#estructura-de-datos-importados)
6. [Limitaciones y Consideraciones](#limitaciones-y-consideraciones)

---

## 🔧 Configuración Inicial

### 1. Obtener API Key de TMDb

1. Crea una cuenta en [TMDb](https://www.themoviedb.org/signup)
2. Ve a tu perfil → Settings → API
3. Solicita una API Key (elige "Developer")
4. Copia tu API Key

### 2. Configurar Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` y añade tu API key:

```env
TMDB_API_KEY=tu_api_key_aqui
```

### 3. Ejecutar Migraciones

Asegúrate de que la base de datos esté configurada:

```bash
npm run db:migrate
```

---

## 🚀 Uso del Importador

El importador de TMDb es un script que puede ejecutarse de varias formas:

### Opción 1: Scripts NPM (Recomendado)

```bash
# Importar todo (géneros + películas)
npm run tmdb:all

# Importar solo géneros
npm run tmdb:genres

# Importar películas populares
npm run tmdb:popular

# Importar películas mejor valoradas
npm run tmdb:top-rated
```

### Opción 2: Comando Directo con Node

```bash
node src/scripts/tmdb-importer.js <comando> [argumentos]
```

---

## 📚 Comandos Disponibles

### 1. Importar Géneros

Importa todos los géneros de películas disponibles en TMDb.

```bash
npm run tmdb:genres
# o
node src/scripts/tmdb-importer.js genres
```

**Resultado:** ~20 géneros (Action, Drama, Comedy, etc.)

---

### 2. Importar Películas Populares

Importa las películas más populares actualmente.

```bash
npm run tmdb:popular
# o
node src/scripts/tmdb-importer.js popular [páginas]
```

**Parámetros:**
- `páginas` (opcional): Número de páginas a importar (cada página = 20 películas)
- Default: 2 páginas (40 películas)

**Ejemplo:**
```bash
# Importar 5 páginas (100 películas)
node src/scripts/tmdb-importer.js popular 5
```

---

### 3. Importar Películas Mejor Valoradas

Importa las películas mejor valoradas de todos los tiempos.

```bash
npm run tmdb:top-rated
# o
node src/scripts/tmdb-importer.js top-rated [páginas]
```

**Parámetros:**
- `páginas` (opcional): Número de páginas a importar
- Default: 2 páginas (40 películas)

**Ejemplo:**
```bash
# Importar 10 páginas (200 películas)
node src/scripts/tmdb-importer.js top-rated 10
```

---

### 4. Importar Películas por Género

Importa películas de un género específico.

```bash
node src/scripts/tmdb-importer.js genre <genreId> [páginas]
```

**Parámetros:**
- `genreId` (requerido): ID del género en TMDb
- `páginas` (opcional): Número de páginas a importar
- Default: 1 página (20 películas)

**IDs de Géneros Comunes:**
- 28 - Action
- 12 - Adventure
- 16 - Animation
- 35 - Comedy
- 80 - Crime
- 18 - Drama
- 14 - Fantasy
- 27 - Horror
- 10749 - Romance
- 878 - Science Fiction
- 53 - Thriller

**Ejemplo:**
```bash
# Importar 3 páginas de películas de ciencia ficción
node src/scripts/tmdb-importer.js genre 878 3
```

---

### 5. Importar una Película Específica

Importa una película por su ID de TMDb.

```bash
npm run tmdb:movie <movieId>
# o
node src/scripts/tmdb-importer.js movie <movieId>
```

**Parámetros:**
- `movieId` (requerido): ID de la película en TMDb

**Ejemplo:**
```bash
# Importar "The Shawshank Redemption" (ID: 278)
node src/scripts/tmdb-importer.js movie 278

# Importar "Inception" (ID: 27205)
node src/scripts/tmdb-importer.js movie 27205
```

> **Tip:** Puedes encontrar el ID de TMDb en la URL de cualquier película:
> `https://www.themoviedb.org/movie/278-the-shawshank-redemption`
> (El ID es 278)

---

### 6. Importar Todo

Importa géneros, películas populares y mejor valoradas en una sola ejecución.

```bash
npm run tmdb:all
# o
node src/scripts/tmdb-importer.js all [páginasPorCategoría]
```

**Parámetros:**
- `páginasPorCategoría` (opcional): Páginas a importar de cada categoría
- Default: 2 páginas por categoría

**Ejemplo:**
```bash
# Importar 5 páginas de cada categoría
node src/scripts/tmdb-importer.js all 5
```

**Esto importará:**
- Todos los géneros
- 100 películas populares (5 páginas × 20)
- 100 películas mejor valoradas (5 páginas × 20)
- **Total: ~200 películas + géneros + créditos**

---

## 💡 Ejemplos de Uso

### Ejemplo 1: Setup Inicial Rápido

```bash
# 1. Importar géneros
npm run tmdb:genres

# 2. Importar algunas películas populares
node src/scripts/tmdb-importer.js popular 2

# 3. Importar algunas películas mejor valoradas
node src/scripts/tmdb-importer.js top-rated 2
```

**Resultado:** ~80 películas con todos sus datos

---

### Ejemplo 2: Base de Datos Completa

```bash
# Importar todo con 10 páginas por categoría
node src/scripts/tmdb-importer.js all 10
```

**Resultado:** ~400 películas + géneros + créditos

---

### Ejemplo 3: Películas Específicas

```bash
# Importar películas famosas específicas
node src/scripts/tmdb-importer.js movie 278    # The Shawshank Redemption
node src/scripts/tmdb-importer.js movie 238    # The Godfather
node src/scripts/tmdb-importer.js movie 424    # Schindler's List
node src/scripts/tmdb-importer.js movie 27205  # Inception
node src/scripts/tmdb-importer.js movie 157336 # Interstellar
```

---

### Ejemplo 4: Colección por Género

```bash
# Importar solo películas de acción
node src/scripts/tmdb-importer.js genres
node src/scripts/tmdb-importer.js genre 28 5

# Importar solo películas de ciencia ficción
node src/scripts/tmdb-importer.js genre 878 5
```

---

## 📦 Estructura de Datos Importados

### Por Película se Importa:

1. **Datos Básicos:**
   - Título (español e inglés)
   - Sinopsis
   - Fecha de estreno
   - Duración
   - Idioma original
   - Posters y backdrops

2. **Géneros:**
   - Asociación automática con géneros de TMDb
   - Relación many-to-many

3. **Créditos:**
   - **Director:** 1 persona
   - **Actores principales:** Top 10
   - Nombre del personaje (para actores)

### Tablas Afectadas:

```
movies          → Película principal
genres          → Géneros (si no existen)
movie_genres    → Relación película-género
people          → Directores y actores
credits         → Relación película-persona con rol
```

---

## ⚠️ Limitaciones y Consideraciones

### 1. Rate Limiting

La API de TMDb tiene límites de peticiones:
- **40 requests por 10 segundos**
- El script incluye pausas de 250ms entre películas

### 2. Duplicados

- El importador **no importa películas duplicadas**
- Usa `tmdb_id` como identificador único
- Si una película ya existe, se omite

### 3. Idioma

Por defecto, el importador usa **español (es-ES)**.

Para cambiar el idioma, edita `src/services/tmdbService.js`:

```javascript
this.client = axios.create({
  baseURL: this.baseURL,
  params: {
    api_key: this.apiKey,
    language: 'en-US'  // Cambiar a inglés
  }
});
```

### 4. Datos Incompletos

Algunas películas pueden no tener:
- Duración (`runtime`)
- Posters o backdrops
- Directores conocidos

El script maneja estos casos y los omite cuando es necesario.

### 5. Créditos Limitados

Por razones de performance, solo se importan:
- 1 director
- Top 10 actores

Para importar más, modifica `src/scripts/tmdb-importer.js`:

```javascript
// Cambiar de 10 a 20 actores
const topActors = credits.cast.slice(0, 20);
```

---

## 🔍 Verificar Importación

### Consultar en la Base de Datos

```sql
-- Ver películas importadas
SELECT COUNT(*) FROM general_movie_reviews_service.movies;

-- Ver géneros importados
SELECT * FROM general_movie_reviews_service.genres;

-- Ver películas con géneros
SELECT m.title, g.name
FROM general_movie_reviews_service.movies m
JOIN general_movie_reviews_service.movie_genres mg ON m.id = mg.movie_id
JOIN general_movie_reviews_service.genres g ON mg.genre_id = g.id
ORDER BY m.title;

-- Ver créditos
SELECT m.title, p.name, c.role_type, c.character_name
FROM general_movie_reviews_service.movies m
JOIN general_movie_reviews_service.credits c ON m.id = c.movie_id
JOIN general_movie_reviews_service.people p ON c.person_id = p.id
ORDER BY m.title, c.role_type;
```

### Usar la API

```bash
# Ver todas las películas
curl http://localhost:3001/api/movies

# Ver géneros
curl http://localhost:3001/api/genres

# Ver películas de un género
curl http://localhost:3001/api/movies/genre/1

# Buscar películas
curl http://localhost:3001/api/movies/search?q=inception
```

---

## 🎯 Recomendaciones

### Para Desarrollo:
```bash
# Setup rápido (40-50 películas)
node src/scripts/tmdb-importer.js all 2
```

### Para Testing:
```bash
# Solo algunas películas específicas
node src/scripts/tmdb-importer.js movie 278
node src/scripts/tmdb-importer.js movie 27205
```

### Para Producción:
```bash
# Base de datos completa (400-500 películas)
node src/scripts/tmdb-importer.js all 10

# O ejecutar en bloques
node src/scripts/tmdb-importer.js genres
node src/scripts/tmdb-importer.js popular 20
node src/scripts/tmdb-importer.js top-rated 20
```

---

## 🐛 Solución de Problemas

### Error: "TMDB_API_KEY is not defined"

**Solución:** Verifica que tu `.env` tenga la API key:
```bash
# .env
TMDB_API_KEY=tu_api_key_aqui
```

### Error: "Table doesn't exist"

**Solución:** Ejecuta las migraciones:
```bash
npm run db:migrate
```

### Error: "Rate limit exceeded"

**Solución:** Espera unos minutos o aumenta el delay en el script:
```javascript
// En tmdb-importer.js, cambiar de 250ms a 500ms
await this.sleep(500);
```

### Películas No se Importan

**Posibles causas:**
1. Ya existen en la base de datos (verificar por `tmdb_id`)
2. Error en la API de TMDb
3. Película sin datos completos

**Solución:** Revisar los logs del script para ver qué ocurrió.

---

## 📚 Recursos Adicionales

- [Documentación oficial de TMDb API](https://developers.themoviedb.org/3)
- [TMDb API Explorer](https://www.themoviedb.org/settings/api)
- [Lista completa de géneros](https://api.themoviedb.org/3/genre/movie/list?api_key=TU_KEY)

---

## ✅ Checklist de Importación

- [ ] Obtener API Key de TMDb
- [ ] Configurar `.env` con `TMDB_API_KEY`
- [ ] Ejecutar migraciones (`npm run db:migrate`)
- [ ] Importar géneros (`npm run tmdb:genres`)
- [ ] Importar películas (`npm run tmdb:all` o comandos específicos)
- [ ] Verificar importación (consultas SQL o API)
- [ ] Probar endpoints de la API

¡Listo para alimentar tu base de datos! 🎬
