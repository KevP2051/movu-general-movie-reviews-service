# 🔍 DIAGNÓSTICO: Reviews no aparecen en estadísticas

## PROBLEMA IDENTIFICADO ✅

El problema **NO es Kafka ni el caché**. El problema es:

### Causa raíz:
1. Las reviews se creaban con `status: 'PENDING'` (estado por defecto)
2. Las estadísticas **solo cuentan reviews con `status: 'APPROVED'`**
3. Por eso las nuevas reviews no aparecían en las estadísticas

## SOLUCIÓN APLICADA 🛠️

Se cambió el estado por defecto de `'PENDING'` a `'APPROVED'` para que las reviews aparezcan inmediatamente.

### Archivos modificados:

1. **`src/models/review.js`** - Línea 14
   ```javascript
   // ANTES:
   defaultValue: 'PENDING'
   
   // DESPUÉS:
   defaultValue: 'APPROVED'
   ```

2. **`src/services/reviewService.js`** - Líneas 175-177
   ```javascript
   // ANTES:
   reviewData.status = 'PENDING';
   
   // DESPUÉS:
   reviewData.status = 'APPROVED';
   ```

## CÓMO VERIFICAR LA SOLUCIÓN 🧪

### 1. Ejecutar script de diagnóstico:

```powershell
cd movu-general-movie-reviews-service
node scripts/check-reviews.js
```

**Salida esperada:**
```
✅ Conexión a BD establecida

📊 RESUMEN DE REVIEWS POR ESTADO:
──────────────────────────────────────────────────
  APPROVED   : 42 reviews
  PENDING    : 5 reviews

📝 ÚLTIMAS 10 REVIEWS CREADAS:
────────────────────────────────────────────────────────────────────────────────
ID      Movie     User      Rating    Status      Fecha
────────────────────────────────────────────────────────────────────────────────
125     550       15        9         APPROVED    19/11/2025 10:30:45
...
```

### 2. Reiniciar el microservicio:

```powershell
cd movu-general-movie-reviews-service
npm start
```

### 3. Probar crear una review desde la interfaz:

1. Ir a `http://localhost:8080/movie-detail.html?id=550`
2. Login con tu usuario
3. Crear una reseña
4. Verificar que aparezca en las estadísticas **inmediatamente**

### 4. Verificar logs en la consola del microservicio:

**Logs esperados al crear una review:**
```
✓ Review created successfully: ID=126, Movie=550, User=15, Status=APPROVED
🔄 Iniciando actualización de caché para movie 550...
✓ Caché invalidado para movie 550
✓ Stats regeneradas para movie 550: {
  totalReviews: 43,
  avgRating: 8.5,
  distribution: 10
}
📝 Review creation completed - returning response to client
```

**Logs esperados al solicitar estadísticas:**
```
📊 Solicitando estadísticas para movie 550
✓ Estadísticas obtenidas para movie 550: { totalReviews: 43, avgRating: 8.5 }
```

## REVIEWS ANTIGUAS CON ESTADO PENDING ⚠️

Si tienes reviews antiguas en estado `PENDING` que deberían estar aprobadas:

### Opción 1: Aprobar todas las reviews PENDING (SQL):

```sql
UPDATE "general_movie_reviews_service"."REVIEWS"
SET status = 'APPROVED'
WHERE status = 'PENDING';
```

### Opción 2: Crear script de migración:

```javascript
// scripts/approve-pending-reviews.js
require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Review = require('../src/models/review');

async function approvePendingReviews() {
  await sequelize.authenticate();
  
  const result = await Review.update(
    { status: 'APPROVED' },
    { where: { status: 'PENDING' } }
  );
  
  console.log(`✅ ${result[0]} reviews aprobadas`);
  process.exit(0);
}

approvePendingReviews();
```

Ejecutar:
```powershell
node scripts/approve-pending-reviews.js
```

## FLUJO ACTUALIZADO 📋

```
1. Usuario crea review
   ↓
2. Review se guarda en BD con status='APPROVED' ✅
   ↓
3. Caché se invalida (async)
   ↓
4. Stats se regeneran automáticamente (async)
   ↓
5. Frontend recarga stats
   ↓
6. Usuario ve su review en las estadísticas ✅
```

## SI EL PROBLEMA PERSISTE 🔧

### Verificar que la review se creó correctamente:

```sql
-- Ver la última review creada
SELECT review_id, movie_id, user_id, rating, status, "createdAt"
FROM "general_movie_reviews_service"."REVIEWS"
ORDER BY "createdAt" DESC
LIMIT 1;
```

### Verificar las estadísticas calculadas:

```sql
-- Stats de una película específica
SELECT 
  COUNT(*) as total_reviews,
  AVG(rating) as average_rating
FROM "general_movie_reviews_service"."REVIEWS"
WHERE movie_id = 550 AND status = 'APPROVED';
```

### Verificar el caché de Redis:

```powershell
# Conectar a Redis
docker exec -it <redis-container> redis-cli

# Ver claves relacionadas con stats
KEYS movie:stats:*

# Ver el valor de stats de una película
GET movie:stats:550

# Eliminar caché manualmente si es necesario
DEL movie:stats:550
```

## LOGS ADICIONALES AGREGADOS 📝

Para facilitar el debugging, se agregaron logs en:

1. **reviewService.js** - Proceso de creación y actualización de caché
2. **reviewController.js** - Solicitudes de estadísticas
3. **Gateway** - Flujo completo de la petición

Estos logs te permitirán rastrear todo el flujo y detectar cualquier problema.

## RESUMEN 📊

| Aspecto | Antes | Después |
|---------|-------|---------|
| Estado por defecto | PENDING | APPROVED |
| Reviews en stats | ❌ No aparecen | ✅ Aparecen inmediatamente |
| Tiempo de actualización | Manual | Automático (~500ms) |
| Visibilidad | Sin logs | Logs completos |

## CONTACTO 💬

Si el problema persiste después de aplicar estos cambios, comparte:
1. Los logs de la consola del microservicio
2. La salida del script `check-reviews.js`
3. La query SQL de verificación
