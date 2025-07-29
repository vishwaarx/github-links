// --- START backend/src/monitoring.js --- //
const Sentry = require('@sentry/node');
const winston = require('winston');

let logger;

const setupSentry = () => {
  // Initialize Sentry
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://stub-dsn@sentry.io/123',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: require('./server') })
    ]
  });

  // Setup Winston logger
  logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: 'repo-verifier-backend' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  // Add file transport in production
  if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }));
    logger.add(new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }));
  }

  console.log('Monitoring setup complete');
};

const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    extra: context
  });
  
  logger.error('Exception captured', {
    error: error.message,
    stack: error.stack,
    context
  });
};

const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, level);
  
  logger.log(level, message, context);
};

const getLogger = () => logger;

module.exports = {
  setupSentry,
  captureException,
  captureMessage,
  getLogger
};
// --- END backend/src/monitoring.js --- // 