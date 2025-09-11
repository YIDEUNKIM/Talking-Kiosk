const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs-extra');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// 라우터 임포트
const voiceRoutes = require('./routes/voice');
const orderRoutes = require('./routes/order');
const menuRoutes = require('./routes/menu');

// 소켓 핸들러 임포트
const socketHandler = require('./socket/socketHandler');

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: config.socket.corsOrigin,
        methods: ['GET', 'POST']
      },
      pingTimeout: config.socket.pingTimeout,
      pingInterval: config.socket.pingInterval
    });
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocket();
    this.initializeErrorHandling();
    this.initializeDirectories();
  }

  initializeMiddleware() {
    // 보안 미들웨어
    this.app.use(helmet());
    
    // CORS 설정
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // 로깅 미들웨어
    this.app.use(morgan('combined', {
      stream: { write: message => logger.info(message.trim()) }
    }));
    
    // JSON 파싱
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // 정적 파일 서빙
    this.app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    this.app.use('/public', express.static(path.join(__dirname, '../public')));
    
    // 레이트 리미팅
    this.app.use(rateLimiter);
  }

  initializeRoutes() {
    // API 라우트
    this.app.use('/api/voice', voiceRoutes);
    this.app.use('/api/order', orderRoutes);
    this.app.use('/api/menu', menuRoutes);
    
    // 헬스 체크
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    // 404 핸들러
    this.app.use('*', (req, res) => {
      res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
      });
    });
  }

  initializeSocket() {
    socketHandler(this.io);
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  async initializeDirectories() {
    const directories = [
      './logs',
      './uploads',
      './data',
      './data/orders'
    ];

    for (const dir of directories) {
      try {
        await fs.ensureDir(path.join(__dirname, dir));
        logger.info(`Directory ensured: ${dir}`);
      } catch (error) {
        logger.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  start() {
    this.server.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 Server running on http://${config.server.host}:${config.server.port}`);
      logger.info(`📊 Environment: ${config.server.env}`);
      logger.info(`🔊 Socket.IO enabled`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  shutdown() {
    logger.info('🛑 Shutting down server...');
    this.server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  }
}

// 서버 시작
const server = new Server();
server.start();

module.exports = server;

