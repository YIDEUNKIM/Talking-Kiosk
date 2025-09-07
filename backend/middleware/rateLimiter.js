const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15분
  max: config.rateLimit.maxRequests, // 최대 100 요청
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
    });
  }
});

module.exports = rateLimiter;
