/**
 * Middleware para extraer información del usuario desde headers enviados por el gateway
 * El gateway ya validó el JWT y envía la información del usuario en headers personalizados
 */
const extractUserFromHeaders = (req, res, next) => {
  // El gateway envía estos headers después de validar el JWT
  if (req.headers['x-user-id']) {
    req.user = {
      id: req.headers['x-user-id'],
      email: req.headers['x-user-email'] || null,
      role: req.headers['x-user-role'] || 'user'
    };
    
    // Log para debugging (remover en producción si es necesario)
    if (process.env.NODE_ENV === 'development') {
      console.log('User extracted from gateway headers:', req.user);
    }
  }
  
  // Correlation ID para tracking de requests a través de microservicios
  if (req.headers['x-correlation-id']) {
    req.correlationId = req.headers['x-correlation-id'];
  }
  
  // Gateway identifier
  if (req.headers['x-gateway']) {
    req.gateway = req.headers['x-gateway'];
  }
  
  next();
};

/**
 * Middleware para requerir que el usuario esté autenticado
 * Verifica que el gateway haya enviado información del usuario
 */
const requireAuth = (req, res, next) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'You must be logged in to access this resource'
    });
  }
  
  next();
};

/**
 * Middleware para requerir que el usuario tenga rol de admin
 * Confía en el x-user-role validado por el gateway
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Admin access required'
    });
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario está accediendo a sus propios recursos
 * O que es admin
 */
const requireOwnershipOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }
    
    const resourceUserId = req.params[userIdParam] || req.body.user_id;
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only access your own resources'
      });
    }
    
    next();
  };
};

module.exports = {
  extractUserFromHeaders,
  requireAuth,
  requireAdmin,
  requireOwnershipOrAdmin
};
