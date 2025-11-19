-- ========================================
-- SCRIPT DE DIAGNÓSTICO DE REVIEWS
-- ========================================

-- 1. Ver TODAS las reviews (sin filtro de status)
SELECT 
    review_id,
    movie_id,
    user_id,
    rating,
    title,
    status,
    "createdAt",
    "updatedAt"
FROM "general_movie_reviews_service"."REVIEWS"
ORDER BY "createdAt" DESC
LIMIT 20;

-- 2. Contar reviews por estado
SELECT 
    status,
    COUNT(*) as total
FROM "general_movie_reviews_service"."REVIEWS"
GROUP BY status;

-- 3. Ver estadísticas de una película específica (cambiar movie_id)
SELECT 
    COUNT(*) as total_reviews,
    AVG(rating) as average_rating,
    MIN(rating) as min_rating,
    MAX(rating) as max_rating
FROM "general_movie_reviews_service"."REVIEWS"
WHERE movie_id = 550  -- Cambiar por el ID de tu película
AND status = 'APPROVED';

-- 4. Ver distribución de ratings de una película
SELECT 
    rating,
    COUNT(*) as count
FROM "general_movie_reviews_service"."REVIEWS"
WHERE movie_id = 550  -- Cambiar por el ID de tu película
AND status = 'APPROVED'
GROUP BY rating
ORDER BY rating DESC;

-- 5. Ver la última review insertada
SELECT *
FROM "general_movie_reviews_service"."REVIEWS"
ORDER BY "createdAt" DESC
LIMIT 1;

-- 6. Verificar si hay reviews en PENDING que deberían estar APPROVED
SELECT 
    review_id,
    movie_id,
    user_id,
    rating,
    status,
    "createdAt"
FROM "general_movie_reviews_service"."REVIEWS"
WHERE status = 'PENDING'
ORDER BY "createdAt" DESC;
