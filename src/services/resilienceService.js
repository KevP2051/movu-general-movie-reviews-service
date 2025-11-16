const CircuitBreaker = require('opossum');
const { sequelize } = require('../config/database');

class ResilienceService {
  constructor() {
    this.breakers = {};
    this.isDatabaseDown = false;
    this.dbCheckInterval = null;
  }

  /**
   * Crear un Circuit Breaker para operaciones de base de datos
   */
  createDatabaseBreaker(name, options = {}) {
    const defaultOptions = {
      timeout: 1000, // 1 segundo timeout (reducido de 3s para fallar rápido)
      errorThresholdPercentage: 50, // 50% de errores para abrir el circuito
      resetTimeout: 10000, // 10 segundos antes de intentar de nuevo
      rollingCountTimeout: 10000, // Ventana de 10 segundos
      rollingCountBuckets: 10,
      name: name
    };

    const breakerOptions = { ...defaultOptions, ...options };
    // Crear breaker con una función que ejecuta la operación pasada como parámetro
    const breaker = new CircuitBreaker(async (operation) => {
      // Ejecutar la operación que se pasa dinámicamente
      return await operation();
    }, breakerOptions);

    // Eventos del Circuit Breaker
    breaker.on('open', () => {
      console.log(`🔴 Circuit Breaker OPEN for ${name} - Database might be down`);
      this.isDatabaseDown = true;
    });

    breaker.on('halfOpen', () => {
      console.log(`🟡 Circuit Breaker HALF-OPEN for ${name} - Testing database connection`);
    });

    breaker.on('close', () => {
      console.log(`🟢 Circuit Breaker CLOSED for ${name} - Database is back online`);
      this.isDatabaseDown = false;
    });

    breaker.on('failure', (error) => {
      console.error(`❌ Circuit Breaker failure for ${name}:`, error.message);
    });

    breaker.on('success', () => {
      // Database operation successful
      if (this.isDatabaseDown) {
        console.log(`✓ Database operation successful for ${name} - Database recovered`);
        this.isDatabaseDown = false;
      }
    });

    breaker.on('timeout', () => {
      console.error(`⏱️ Circuit Breaker timeout for ${name}`);
    });

    breaker.on('reject', () => {
      console.warn(`⛔ Circuit Breaker REJECT for ${name} - Using fallback`);
    });

    this.breakers[name] = breaker;
    return breaker;
  }

  /**
   * Obtener un Circuit Breaker existente
   */
  getBreaker(name) {
    return this.breakers[name];
  }

  /**
   * Verificar si la base de datos está disponible
   */
  async checkDatabaseHealth() {
    try {
      await sequelize.authenticate();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar estado del sistema
   */
  isDatabaseAvailable() {
    return !this.isDatabaseDown;
  }

  /**
   * Iniciar monitoreo periódico de la base de datos
   */
  startDatabaseMonitoring(intervalMs = 5000) {
    if (this.dbCheckInterval) {
      clearInterval(this.dbCheckInterval);
    }

    this.dbCheckInterval = setInterval(async () => {
      const isHealthy = await this.checkDatabaseHealth();
      
      if (!isHealthy && !this.isDatabaseDown) {
        console.log('🔴 Database health check failed - Activating degraded mode');
        this.isDatabaseDown = true;
      } else if (isHealthy && this.isDatabaseDown) {
        console.log('🟢 Database health check passed - Deactivating degraded mode');
        this.isDatabaseDown = false;
        
        // IMPORTANTE: Resetear todos los Circuit Breakers para que vuelvan a intentar
        console.log('🔄 Resetting all Circuit Breakers to allow reconnection');
        this.resetAllBreakers();
      }
    }, intervalMs);

    console.log(`✓ Database health monitoring started (every ${intervalMs}ms)`);
  }

  /**
   * Detener monitoreo de la base de datos
   */
  stopDatabaseMonitoring() {
    if (this.dbCheckInterval) {
      clearInterval(this.dbCheckInterval);
      this.dbCheckInterval = null;
      console.log('✓ Database health monitoring stopped');
    }
  }

  /**
   * Obtener estadísticas de todos los Circuit Breakers
   */
  getStats() {
    const stats = {};
    
    Object.keys(this.breakers).forEach(name => {
      const breaker = this.breakers[name];
      stats[name] = {
        name: breaker.name,
        state: breaker.opened ? 'OPEN' : breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
        stats: breaker.stats
      };
    });

    return {
      breakers: stats,
      isDatabaseDown: this.isDatabaseDown,
      totalBreakers: Object.keys(this.breakers).length
    };
  }

  /**
   * Resetear todos los Circuit Breakers
   */
  resetAllBreakers() {
    Object.values(this.breakers).forEach(breaker => {
      breaker.close();
    });
    this.isDatabaseDown = false;
    console.log('✓ All circuit breakers reset');
  }

  /**
   * Wrapper genérico para operaciones con fallback
   */
  async executeWithFallback(breakerName, operation, fallback, fallbackData = null) {
    try {
      let breaker = this.getBreaker(breakerName);
      
      if (!breaker) {
        breaker = this.createDatabaseBreaker(breakerName);
      }

      // Ejecutar operación protegida por Circuit Breaker con la operación como parámetro
      return await breaker.fire(operation);
    } catch (error) {
      // Si el circuito está abierto o hay error, lanzar excepción para que el servicio maneje
      console.log(`⚠️ Circuit breaker error for ${breakerName}:`, error.message);
      
      // Si hay fallback, usarlo
      if (fallback) {
        if (typeof fallback === 'function') {
          return await fallback(fallbackData);
        }
        return fallback;
      }
      
      // Si no hay fallback, lanzar error para que el servicio decida qué hacer
      throw error;
    }
  }
}

// Singleton
let resilienceServiceInstance = null;

module.exports = {
  getResilienceService: () => {
    if (!resilienceServiceInstance) {
      resilienceServiceInstance = new ResilienceService();
    }
    return resilienceServiceInstance;
  },
  ResilienceService
};
