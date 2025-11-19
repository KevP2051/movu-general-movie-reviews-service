# 🔧 MODO DEBUG ACTIVADO - Redis y Kafka DESACTIVADOS

## ⚠️ CAMBIOS APLICADOS

Se han **desactivado temporalmente** Redis y Kafka para aislar el problema de guardado de reviews.

### Modificaciones en `reviewService.js`:

1. **`createReview()`** - Línea ~178
   - ❌ Kafka desactivado
   - ❌ Redis desactivado
   - ✅ Guardado DIRECTO en PostgreSQL
   - ✅ Logs detallados de cada paso

2. **`getMovieStats()`** - Línea ~120
   - ❌ Cache desactivado
   - ✅ Consulta DIRECTA a PostgreSQL

3. **`getReviewsByMovie()`** - Línea ~76
   - ❌ Cache desactivado
   - ✅ Consulta DIRECTA a PostgreSQL

---

## 🧪 PASOS PARA PROBAR

### 1. **Reiniciar el microservicio**

```powershell
cd movu-general-movie-reviews-service

# Detener el servicio actual (Ctrl+C)

# Limpiar y reiniciar
npm start
```

### 2. **Verificar estado inicial de la BD**

```powershell
# Ejecutar script de diagnóstico
node scripts/check-reviews.js
```

O conectar directamente a PostgreSQL:

```powershell
# Conectar a PostgreSQL
psql -h localhost -U postgres -d movu_db

# Ejecutar queries del archivo
\i 'scripts/check-reviews.sql'
```

### 3. **Crear una review desde la interfaz**

1. Ir a: `http://localhost:8080/movie-detail.html?id=550`
2. Login con tu usuario
3. Escribir una review
4. Hacer clic en "Publicar"

### 4. **LOGS ESPERADOS en la consola del microservicio:**

```bash
🔧 [DEBUG MODE] Guardando review directamente en PostgreSQL...
📝 Datos a guardar: {
  movie_id: 550,
  user_id: 15,
  rating: 9,
  title: 'Mi opinión',
  status: 'APPROVED'
}
✅ [DEBUG] Review guardada EXITOSAMENTE en PostgreSQL:
   - ID: 1
   - Movie: 550
   - User: 15
   - Rating: 9
   - Status: APPROVED
   - Created: 2025-11-19T10:30:45.123Z
⚠️ [DEBUG] Caché y Kafka DESACTIVADOS - sin invalidación ni regeneración
📝 Review creation completed - returning response to client
```

**Cuando el frontend solicita estadísticas:**

```bash
📊 Solicitando estadísticas para movie 550
🔧 [DEBUG] Obteniendo stats de movie 550 DIRECTAMENTE de PostgreSQL (sin caché)
✅ [DEBUG] Stats obtenidas de BD para movie 550: {
  totalReviews: 1,
  avgRating: 9,
  hasDistribution: true
}
✓ Estadísticas obtenidas para movie 550: { totalReviews: 1, avgRating: 9 }
```

### 5. **Verificar que se guardó en PostgreSQL**

```powershell
# Opción A: Script de Node.js
node scripts/check-reviews.js

# Opción B: SQL directo
psql -h localhost -U postgres -d movu_db -c "
SELECT review_id, movie_id, user_id, rating, status, \"createdAt\" 
FROM \"general_movie_reviews_service\".\"REVIEWS\" 
ORDER BY \"createdAt\" DESC 
LIMIT 5;"
```

**Salida esperada:**
```
 review_id | movie_id | user_id | rating | status  |        createdAt
-----------+----------+---------+--------+---------+-------------------------
         1 |      550 |      15 |      9 | APPROVED| 2025-11-19 10:30:45.123
```

---

## 🎯 ESCENARIOS POSIBLES

### ✅ **ESCENARIO 1: La review SE guarda en BD**

**Logs muestran:**
```
✅ [DEBUG] Review guardada EXITOSAMENTE en PostgreSQL
```

**Y en la BD aparece:**
```sql
SELECT COUNT(*) FROM "general_movie_reviews_service"."REVIEWS";
-- count: 1 ó más
```

**CONCLUSIÓN:** El problema era Redis/Kafka. La review SÍ se guardaba pero el caché estaba causando el problema.

**SOLUCIÓN:**
- Revisar configuración de Redis
- Verificar que los keys de caché se invalidan correctamente
- Considerar tiempos de expiración más cortos

---

### ❌ **ESCENARIO 2: La review NO se guarda en BD**

**Logs muestran:**
```
❌ [DEBUG] ERROR al guardar en PostgreSQL: ...
```

**Y en la BD NO aparece:**
```sql
SELECT COUNT(*) FROM "general_movie_reviews_service"."REVIEWS";
-- count: 0
```

**CONCLUSIÓN:** El problema es la conexión a PostgreSQL o el modelo de datos.

**SOLUCIÓN:**
- Verificar conexión a PostgreSQL
- Verificar que el schema existe
- Verificar permisos de la tabla
- Verificar que el modelo Sequelize está bien configurado

---

### ⚠️ **ESCENARIO 3: La review se guarda pero con status PENDING**

**En la BD aparece:**
```sql
SELECT status FROM "general_movie_reviews_service"."REVIEWS" ORDER BY "createdAt" DESC LIMIT 1;
-- status: PENDING
```

**CONCLUSIÓN:** El cambio de `defaultValue: 'APPROVED'` no se aplicó correctamente.

**SOLUCIÓN:**
```powershell
# Actualizar todas las reviews PENDING a APPROVED
node scripts/approve-pending-reviews.js
```

---

## 📊 QUERIES SQL ÚTILES

### Ver todas las reviews:
```sql
SELECT * FROM "general_movie_reviews_service"."REVIEWS" 
ORDER BY "createdAt" DESC;
```

### Contar por estado:
```sql
SELECT status, COUNT(*) 
FROM "general_movie_reviews_service"."REVIEWS" 
GROUP BY status;
```

### Ver stats de una película:
```sql
SELECT 
  COUNT(*) as total,
  AVG(rating) as avg_rating
FROM "general_movie_reviews_service"."REVIEWS"
WHERE movie_id = 550 AND status = 'APPROVED';
```

### Aprobar todas las reviews PENDING:
```sql
UPDATE "general_movie_reviews_service"."REVIEWS"
SET status = 'APPROVED'
WHERE status = 'PENDING';
```

---

## 🔄 REACTIVAR REDIS Y KAFKA

Una vez confirmado que el guardado funciona, puedes reactivar Redis y Kafka:

1. Revertir los cambios en `reviewService.js`
2. O usar un flag de entorno:

```javascript
// En reviewService.js
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

if (DEBUG_MODE) {
  // Código sin caché ni Kafka
} else {
  // Código normal con caché y Kafka
}
```

Agregar en `.env`:
```
DEBUG_MODE=true  # Para debugging
# DEBUG_MODE=false  # Para producción
```

---

## 📞 REPORTE DE RESULTADOS

Después de probar, comparte:

1. ✅ Los logs de la consola del microservicio
2. ✅ El resultado de `node scripts/check-reviews.js`
3. ✅ El resultado de la query SQL de verificación
4. ✅ Si la review aparece o no en la interfaz

Esto me ayudará a identificar exactamente dónde está el problema.
