const path = require('path');
const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const voiceService = require('../services/voiceService');
const orderService = require('../services/orderService');
const menuService = require('../services/menuService');

class SocketHandler {
  constructor() {
    this.connectedClients = new Map();
    this.activeSessions = new Map();
  }

  /**
   * 소켓 연결 처리
   * @param {Object} io - Socket.IO 인스턴스
   */
  handle(io) {
    io.on('connection', (socket) => {
      logger.info('Client connected:', { socketId: socket.id, ip: socket.handshake.address });

      // 클라이언트 등록
      this.connectedClients.set(socket.id, {
        id: socket.id,
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        connectedAt: new Date().toISOString(),
        currentPage: 'menu',
        sessionData: {}
      });

      // 음성 스트림 시작
      socket.on('voice:start', async (data) => {
        try {
          logger.info('Voice stream started:', { socketId: socket.id, data });
          
          const client = this.connectedClients.get(socket.id);
          if (client) {
            client.currentPage = data.currentPage || 'menu';
            client.sessionData = data.sessionData || {};
          }

          socket.emit('voice:started', {
            success: true,
            message: 'Voice stream started',
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          logger.error('Voice start error:', error);
          socket.emit('voice:error', {
            success: false,
            error: 'Failed to start voice stream'
          });
        }
      });

      // 음성 데이터 수신
      socket.on('voice:data', async (data) => {
        try {
          logger.info('Voice data received:', { socketId: socket.id, dataSize: data.length });

          // STT 처리 (실제 구현에서는 오디오 데이터를 처리)
          const text = await this.processVoiceData(data);
          
          if (text) {
            // AI 분석
            const analysisResult = await this.analyzeVoiceCommand(socket.id, text);
            
            // 결과 전송
            socket.emit('voice:result', {
              success: true,
              originalText: text,
              analysis: analysisResult,
              timestamp: new Date().toISOString()
            });

            // TTS 응답 생성 및 전송
            if (analysisResult.response) {
              await this.sendTTSResponse(socket, analysisResult.response);
            }
          }

        } catch (error) {
          logger.error('Voice data processing error:', error);
          socket.emit('voice:error', {
            success: false,
            error: 'Failed to process voice data'
          });
        }
      });

      // 음성 스트림 종료
      socket.on('voice:stop', async (data) => {
        try {
          logger.info('Voice stream stopped:', { socketId: socket.id });

          socket.emit('voice:stopped', {
            success: true,
            message: 'Voice stream stopped',
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          logger.error('Voice stop error:', error);
          socket.emit('voice:error', {
            success: false,
            error: 'Failed to stop voice stream'
          });
        }
      });

      // 주문 생성
      socket.on('order:create', async (data) => {
        try {
          logger.info('Order creation requested:', { socketId: socket.id, data });

          const order = await orderService.createOrder(data);
          
          socket.emit('order:created', {
            success: true,
            data: order
          });

          // 모든 클라이언트에게 주문 알림
          io.emit('order:new', {
            orderNumber: order.orderNumber,
            totalPrice: order.totalPrice,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          logger.error('Order creation error:', error);
          socket.emit('order:error', {
            success: false,
            error: 'Failed to create order'
          });
        }
      });

      // 주문 상태 업데이트
      socket.on('order:update', async (data) => {
        try {
          const { orderId, status, updateData } = data;
          
          logger.info('Order update requested:', { socketId: socket.id, orderId, status });

          const order = await orderService.updateOrderStatus(orderId, status, updateData);
          
          socket.emit('order:updated', {
            success: true,
            data: order
          });

          // 주문자에게 상태 변경 알림
          io.emit('order:status_changed', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          logger.error('Order update error:', error);
          socket.emit('order:error', {
            success: false,
            error: 'Failed to update order'
          });
        }
      });

      // 결제 완료
      socket.on('payment:complete', async (data) => {
        try {
          const { orderId, paymentMethod, paymentInfo } = data;
          
          logger.info('Payment completion requested:', { socketId: socket.id, orderId, paymentMethod });

          const order = await orderService.completePayment(orderId, paymentMethod, paymentInfo);
          
          socket.emit('payment:completed', {
            success: true,
            data: order
          });

          // 결제 완료 알림
          io.emit('payment:completed', {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentMethod: order.paymentMethod,
            totalPrice: order.totalPrice,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          logger.error('Payment completion error:', error);
          socket.emit('payment:error', {
            success: false,
            error: 'Failed to complete payment'
          });
        }
      });

      // 페이지 변경
      socket.on('page:change', (data) => {
        try {
          const client = this.connectedClients.get(socket.id);
          if (client) {
            client.currentPage = data.page;
            logger.info('Page changed:', { socketId: socket.id, page: data.page });
          }
        } catch (error) {
          logger.error('Page change error:', error);
        }
      });

      // 연결 해제
      socket.on('disconnect', (reason) => {
        logger.info('Client disconnected:', { 
          socketId: socket.id, 
          reason,
          duration: this.getConnectionDuration(socket.id)
        });

        // 클라이언트 정보 제거
        this.connectedClients.delete(socket.id);
        this.activeSessions.delete(socket.id);
      });

      // 에러 처리
      socket.on('error', (error) => {
        logger.error('Socket error:', { socketId: socket.id, error });
      });
    });

    // 정기적인 통계 전송
    setInterval(() => {
      this.broadcastStatistics(io);
    }, 30000); // 30초마다
  }

  /**
   * 음성 데이터 처리 (STT)
   * @param {Buffer} audioData - 오디오 데이터
   * @returns {string} 변환된 텍스트
   */
  async processVoiceData(audioData) {
    try {
      // 실제 구현에서는 오디오 데이터를 파일로 저장하고 STT 처리
      // 여기서는 시뮬레이션
      return '아메리카노 두 잔 주세요';
    } catch (error) {
      logger.error('Voice data processing failed:', error);
      return null;
    }
  }

  /**
   * 음성 명령 분석
   * @param {string} socketId - 소켓 ID
   * @param {string} text - 음성 텍스트
   * @returns {Object} 분석 결과
   */
  async analyzeVoiceCommand(socketId, text) {
    try {
      const client = this.connectedClients.get(socketId);
      const context = {
        currentPage: client?.currentPage || 'menu',
        sessionData: client?.sessionData || {}
      };

      const menuData = await menuService.getMenuData();
      const analysisResult = await aiService.analyzeOrderIntent(text, menuData, context);

      return analysisResult;
    } catch (error) {
      logger.error('Voice command analysis failed:', error);
      return {
        intent: 'error',
        items: [],
        totalPrice: 0,
        response: '죄송합니다. 다시 말씀해 주시겠어요?',
        nextAction: 'continue'
      };
    }
  }

  /**
   * TTS 응답 전송
   * @param {Object} socket - 소켓 인스턴스
   * @param {string} text - TTS 텍스트
   */
  async sendTTSResponse(socket, text) {
    try {
      const audioFilePath = await voiceService.textToSpeech(text);
      
      socket.emit('voice:tts', {
        success: true,
        audioUrl: `/api/voice/audio/${path.basename(audioFilePath)}`,
        text: text,
        timestamp: new Date().toISOString()
      });

      // 오디오 파일 정리 (5분 후)
      setTimeout(() => {
        voiceService.cleanupAudioFile(audioFilePath);
      }, 300000);

    } catch (error) {
      logger.error('TTS response failed:', error);
      socket.emit('voice:tts_error', {
        success: false,
        error: 'Failed to generate TTS response'
      });
    }
  }

  /**
   * 연결 지속 시간 계산
   * @param {string} socketId - 소켓 ID
   * @returns {string} 연결 지속 시간
   */
  getConnectionDuration(socketId) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      const duration = Date.now() - new Date(client.connectedAt).getTime();
      return `${Math.floor(duration / 1000)}초`;
    }
    return '알 수 없음';
  }

  /**
   * 통계 브로드캐스트
   * @param {Object} io - Socket.IO 인스턴스
   */
  async broadcastStatistics(io) {
    try {
      const stats = {
        connectedClients: this.connectedClients.size,
        activeSessions: this.activeSessions.size,
        timestamp: new Date().toISOString()
      };

      io.emit('system:statistics', stats);
    } catch (error) {
      logger.error('Statistics broadcast failed:', error);
    }
  }

  /**
   * 특정 클라이언트에게 메시지 전송
   * @param {string} socketId - 소켓 ID
   * @param {string} event - 이벤트 이름
   * @param {Object} data - 전송할 데이터
   */
  sendToClient(socketId, event, data) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      // 실제 구현에서는 io.to(socketId).emit(event, data) 사용
      logger.info('Message sent to client:', { socketId, event, data });
    }
  }

  /**
   * 모든 클라이언트에게 메시지 브로드캐스트
   * @param {Object} io - Socket.IO 인스턴스
   * @param {string} event - 이벤트 이름
   * @param {Object} data - 전송할 데이터
   */
  broadcastToAll(io, event, data) {
    io.emit(event, data);
    logger.info('Message broadcasted to all clients:', { event, data });
  }
}

module.exports = (io) => {
  const handler = new SocketHandler();
  handler.handle(io);
  return handler;
};
