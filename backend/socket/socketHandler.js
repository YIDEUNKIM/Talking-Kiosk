const logger = require('../utils/logger');

/**
 * Socket.IO 핸들러 초기화
 * @param {Object} io - Socket.IO 서버 인스턴스
 */
const socketHandler = (io) => {
  logger.info('🔌 Socket.IO 핸들러 초기화');

  io.on('connection', (socket) => {
    logger.info(`📱 클라이언트 연결됨: ${socket.id}`);

    // 클라이언트에게 연결 확인 메시지 전송
    socket.emit('connected', {
      message: '서버에 연결되었습니다',
      clientId: socket.id,
      timestamp: new Date().toISOString()
    });

    // 음성 처리 상태 업데이트
    socket.on('voice_status_update', (data) => {
      logger.info('🎤 음성 상태 업데이트:', data);
      // 다른 클라이언트들에게 상태 브로드캐스트
      socket.broadcast.emit('voice_status_changed', {
        clientId: socket.id,
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // 주문 상태 업데이트
    socket.on('order_status_update', (data) => {
      logger.info('📦 주문 상태 업데이트:', data);
      // 다른 클라이언트들에게 주문 상태 브로드캐스트
      socket.broadcast.emit('order_status_changed', {
        clientId: socket.id,
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // AI 처리 상태 업데이트
    socket.on('ai_processing_update', (data) => {
      logger.info('🤖 AI 처리 상태 업데이트:', data);
      socket.broadcast.emit('ai_processing_changed', {
        clientId: socket.id,
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // 실시간 음성 인식 결과
    socket.on('voice_recognition_result', (data) => {
      logger.info('🎯 음성 인식 결과:', data);
      socket.broadcast.emit('voice_recognition_received', {
        clientId: socket.id,
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // TTS 상태 업데이트
    socket.on('tts_status_update', (data) => {
      logger.info('🔊 TTS 상태 업데이트:', data);
      socket.broadcast.emit('tts_status_changed', {
        clientId: socket.id,
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // 에러 상태 전송
    socket.on('error_report', (data) => {
      logger.error('❌ 클라이언트 에러 리포트:', data);
      // 관리자에게 에러 알림 (필요시)
      socket.broadcast.emit('error_notification', {
        clientId: socket.id,
        ...data,
        timestamp: new Date().toISOString()
      });
    });

    // 핑/퐁 테스트
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date().toISOString(),
        serverTime: Date.now()
      });
    });

    // 클라이언트 연결 해제
    socket.on('disconnect', (reason) => {
      logger.info(`📱 클라이언트 연결 해제됨: ${socket.id}, 이유: ${reason}`);
      
      // 다른 클라이언트들에게 연결 해제 알림
      socket.broadcast.emit('client_disconnected', {
        clientId: socket.id,
        reason,
        timestamp: new Date().toISOString()
      });
    });

    // 에러 핸들링
    socket.on('error', (error) => {
      logger.error(`❌ 소켓 에러 (${socket.id}):`, error);
    });
  });

  // 서버 전체 상태 브로드캐스트 (주기적)
  setInterval(() => {
    const serverStatus = {
      connectedClients: io.engine.clientsCount,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    io.emit('server_status', serverStatus);
  }, 30000); // 30초마다

  logger.info('✅ Socket.IO 핸들러 설정 완료');
};

module.exports = socketHandler;
