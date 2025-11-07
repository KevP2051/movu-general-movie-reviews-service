/**
 * Middleware para validar parámetros de paginación
 */
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Validar que page y limit sean números positivos
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be greater than 0'
    });
  }

  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }

  // Añadir valores validados a req
  req.pagination = { page, limit };
  next();
};

/**
 * Middleware para validar que un ID sea un número válido
 */
const validateId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = parseInt(req.params[paramName]);

    if (isNaN(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} - must be a positive number`
      });
    }

    req.params[paramName] = id;
    next();
  };
};

/**
 * Middleware para validar datos requeridos en el body
 */
const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = fields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    next();
  };
};

/**
 * Middleware para validar formato de rating (1-10)
 */
const validateRating = (req, res, next) => {
  const { rating } = req.body;

  if (rating !== undefined) {
    const ratingNum = parseFloat(rating);

    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be a number between 1 and 10'
      });
    }

    req.body.rating = ratingNum;
  }

  next();
};

/**
 * Middleware para validar año
 */
const validateYear = (req, res, next) => {
  const { year } = req.body || req.params;

  if (year !== undefined) {
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (isNaN(yearNum) || yearNum < 1888 || yearNum > currentYear + 5) {
      return res.status(400).json({
        success: false,
        message: `Year must be between 1888 and ${currentYear + 5}`
      });
    }

    if (req.body.year) req.body.year = yearNum;
    if (req.params.year) req.params.year = yearNum;
  }

  next();
};

/**
 * Middleware wrapper para manejar errores en funciones async
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  validatePagination,
  validateId,
  validateRequiredFields,
  validateRating,
  validateYear,
  asyncHandler
};
