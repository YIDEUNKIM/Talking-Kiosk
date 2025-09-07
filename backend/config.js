// require('dotenv').config(); // 환경변수 대신 직접 하드코딩 사용

const config = {
  // 서버 설정
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },

  // AI 모델 설정
  ai: {
    provider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    modelName: 'gemma3:27b' // 직접 하드코딩 (Ollama Gemma 모델)
  },

  // 음성 처리 설정
  voice: {
    timeout: parseInt(process.env.VOICE_TIMEOUT) || 10000,
    language: process.env.VOICE_LANGUAGE || 'ko-KR',
    ttsVoice: process.env.TTS_VOICE || 'ko-KR-Wavenet-A'
  },

  // Socket.io 설정
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000
  },

  // 로깅 설정
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
  },

  // 레이트 리미팅
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // 파일 업로드 설정
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    path: process.env.UPLOAD_PATH || './uploads'
  },

  // 보안 설정
  security: {
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-here'
  },

  // 모니터링 설정
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT) || 9090
  }
};

module.exports = config;
