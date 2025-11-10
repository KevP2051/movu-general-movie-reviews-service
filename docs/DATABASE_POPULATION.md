# Población de Base de Datos desde TMDB

## Inicio Rápido

### Población Completa (Recomendado)

```bash
# Población básica (~80 películas)
npm run db:populate

# Población completa (~200 películas)
npm run db:populate:full

# Limpiar y re-poblar desde cero
npm run db:populate:clean
```

Esto ejecutará automáticamente:
1. Migraciones de base de datos
2. Importación de géneros
3. Importación de películas (populares + mejor valoradas)
4. Importación de créditos (directores + actores)
5. Verificación de datos

---

## Comandos Disponibles

### Scripts Maestros

```bash
# Población estándar (2 páginas, ~80 películas)
npm run db:populate

# Limpiar y re-poblar
npm run db:populate:clean

# Población completa (10 páginas, ~400 películas)
npm run db:populate:full
```

### Scripts Personalizados

```bash
# Personalizar número de páginas
node src/scripts/populate-database.js --pages 5

# Solo importar géneros
node src/scripts/populate-database.js --genres-only

# Solo importar películas (requiere géneros existentes)
node src/scripts/populate-database.js --movies-only --pages 10

# Solo importar créditos (requiere películas existentes)
node src/scripts/populate-database.js --credits-only

# Limpiar y poblar con 5 páginas
node src/scripts/populate-database.js --clean --pages 5
```

### Scripts Individuales (Avanzado)

```bash
# TMDB Importer (legacy)
npm run tmdb:genres         # Solo géneros
npm run tmdb:popular        # Películas populares
npm run tmdb:top-rated      # Películas mejor valoradas
npm run tmdb:all            # Todo junto
npm run tmdb:movie 278      # Película específica por ID

# Re-importar solo créditos
npm run tmdb:reimport-credits
```

---

## Qué se Importa

### Por Película:
- **Información básica:** Título, título original, sinopsis
- **Detalles:** Fecha de estreno, duración, idioma original
- **Imágenes:** Poster path, backdrop path
- **Géneros:** Asociación con géneros de TMDB
- **Director:** 1 director
- **Actores:** Top 10 actores principales con personajes

### Por Persona (Director/Actor):
- **Nombre completo**
- **Nombre y apellido** (separados automáticamente)
- **TMDB ID** (para evitar duplicados)
- **Profile path** (foto de perfil)

---

## Construir URLs de Imágenes

Las imágenes se guardan como `path` (ej: `/abc123.jpg`). Para construir la URL completa:

```javascript
const { getPosterUrl, getBackdropUrl } = require('./services/imageService');

// Construir URL del poster
const posterUrl = getPosterUrl(movie.poster_path);
// → https://image.tmdb.org/t/p/w342/abc123.jpg

// Con diferentes tamaños
const { POSTER_SIZES } = require('./services/imageService');
const smallPoster = getPosterUrl(movie.poster_path, POSTER_SIZES.SMALL);   // 185px
const largePoster = getPosterUrl(movie.poster_path, POSTER_SIZES.LARGE);   // 500px
const originalPoster = getPosterUrl(movie.poster_path, POSTER_SIZES.ORIGINAL);
```

### Tamaños Disponibles:

**Posters:**
- `SMALL`: w185 (thumbnails)
- `MEDIUM`: w342 (cards, **default**)
- `LARGE`: w500 (detalles)
- `ORIGINAL`: calidad máxima

**Backdrops:**
- `SMALL`: w300
- `MEDIUM`: w780
- `LARGE`: w1280 (**default**)
- `ORIGINAL`: calidad máxima

**Profiles (fotos de personas):**
- `SMALL`: w45
- `MEDIUM`: w185 (**default**)
- `LARGE`: h632
- `ORIGINAL`: calidad máxima

---

## Requisitos Previos

1. **PostgreSQL** instalado y corriendo
2. **Variables de entorno** configuradas en `.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=movu_db
   DB_USER=postgres
   DB_PASSWORD=
   DB_SCHEMA=general_movie_reviews_service
   
   TMDB_API_KEY=
   ```

3. **API Key de TMDB:**
   - Regístrate en https://www.themoviedb.org/
   - Ve a Settings → API
   - Solicita una API Key (Developer)

---

## Ejemplos de Uso

### Setup Inicial (Primera Vez)

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env con tus credenciales

# 3. Poblar la base de datos
npm run db:populate
```

### Re-población Completa

```bash
# Limpiar todo y volver a poblar
npm run db:populate:clean
```

### Agregar Más Películas

```bash
# Solo importar más películas (sin duplicados)
node src/scripts/populate-database.js --movies-only --pages 20
```

### Actualizar Solo Créditos

```bash
# Re-importar créditos de todas las películas existentes
node src/scripts/populate-database.js --credits-only
```

---

## Estructura Final de la BD

Después de ejecutar `npm run db:populate` tendrás:

```
~19 Géneros
~80-400 Películas (según páginas)
~800-4000 Personas (directores y actores)
~900-4500 Créditos (relaciones película-persona-rol)
```

### Ejemplo de Consulta:

```javascript
const { Movie, Credits, People, Genre } = require('./models');

const movie = await Movie.findOne({
  where: { title: 'El Club de la Lucha' },
  include: [
    {
      model: Credits,
      as: 'credits',
      include: [{ model: People, as: 'person' }]
    },
    {
      model: Genre,
      as: 'genres',
      through: { attributes: [] }
    }
  ]
});

console.log(movie.title);              // "El Club de la Lucha"
console.log(movie.runtime);            // 139
console.log(movie.genres[0].name);     // "Suspense"

const director = movie.credits.find(c => c.role_type === 'director');
console.log(director.person.name);     // "David Fincher"

const actors = movie.credits.filter(c => c.role_type === 'actor');
actors.forEach(a => {
  console.log(a.person.name, '-', a.character_name);
  // "Brad Pitt - Tyler Durden"
});
```

---

## Notas Importantes

1. **Rate Limiting:** TMDB tiene límite de 40 requests por 10 segundos. El script incluye pausas automáticas.

2. **Duplicados:** El script detecta y evita importar películas/personas duplicadas usando `tmdb_id`.

3. **Tiempo de Ejecución:**
   - 2 páginas (~80 películas): ~5-10 minutos
   - 10 páginas (~400 películas): ~25-40 minutos

4. **Campos Eliminados:**
   - `popularity`, `vote_average`, `vote_count` - Calcularás desde tus propias reviews
   - `director` en movies - Está en tabla `credits`
   - `birth_date`, `biography` en people - No disponibles en credits API

---

## Troubleshooting

### Error: "TMDB_API_KEY is not defined"
**Solución:** Verifica que tu `.env` tenga la API key correcta.

### Error: "password authentication failed"
**Solución:** Verifica las credenciales de PostgreSQL en `.env`.

### Error: "column does not exist"
**Solución:** Ejecuta `npm run db:migrate` para actualizar el esquema.

### Películas no se importan
**Solución:** Verifica que los géneros estén importados primero con `--genres-only`.

---

## Más Información

- [Documentación TMDB API](https://developers.themoviedb.org/3)
- [Guía de Imágenes TMDB](https://developers.themoviedb.org/3/getting-started/images)
- Ver `docs/TMDB_IMPORT.md` para guía detallada

---

Listo para poblar tu base de datos!
