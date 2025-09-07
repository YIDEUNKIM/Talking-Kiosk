const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const voiceService = require('../services/voiceService');
const aiService = require('../services/aiService');
const menuService = require('../services/menuService');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * 음성 파일 업로드 및 STT 처리
 * POST /api/voice/upload
 */
router.post('/upload', voiceService.upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    logger.info('Voice upload received:', {
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // 음성 파일 유효성 검사
    const isValid = await voiceService.validateAudioFile(req.file.path);
    if (!isValid) {
      await voiceService.cleanupAudioFile(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Invalid audio file'
      });
    }

    // STT 처리
    const text = await voiceService.speechToText(req.file.path);
    
    // 임시 파일 정리
    await voiceService.cleanupAudioFile(req.file.path);

    res.json({
      success: true,
      data: {
        text,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Voice upload error:', error);
    
    // 에러 발생 시 파일 정리
    if (req.file) {
      await voiceService.cleanupAudioFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Voice processing failed'
    });
  }
});

/**
 * 텍스트를 음성으로 변환 (TTS)
 * POST /api/voice/tts
 */
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    logger.info('TTS request received:', { text });

    // TTS 처리
    const audioFilePath = await voiceService.textToSpeech(text);
    
    // 오디오 파일 스트리밍
    res.setHeader('Content-Type', voiceService.getAudioMimeType(audioFilePath));
    res.setHeader('Content-Disposition', `inline; filename="tts-${Date.now()}.wav"`);
    
    const fs = require('fs');
    const stream = fs.createReadStream(audioFilePath);
    
    stream.pipe(res);
    
    // 스트리밍 완료 후 파일 정리
    stream.on('end', () => {
      voiceService.cleanupAudioFile(audioFilePath);
    });
    
    stream.on('error', (error) => {
      logger.error('TTS streaming error:', error);
      voiceService.cleanupAudioFile(audioFilePath);
    });

  } catch (error) {
    logger.error('TTS error:', error);
    res.status(500).json({
      success: false,
      error: 'Text-to-speech conversion failed'
    });
  }
});

/**
 * 음성 명령 처리 (STT + AI 분석)
 * POST /api/voice/process
 */
router.post('/process', async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    logger.info('Voice command processing:', { text, context });

    // 메뉴 데이터 로드
    const menuData = await menuService.getMenuData();
    
    // AI를 통한 의도 분석
    const analysisResult = await aiService.analyzeOrderIntent(text, menuData, context || {});
    
    // TTS 응답 생성
    let ttsAudioPath = null;
    try {
      ttsAudioPath = await voiceService.textToSpeech(analysisResult.response);
    } catch (ttsError) {
      logger.warn('TTS failed, continuing without audio:', ttsError);
    }

    res.json({
      success: true,
      data: {
        originalText: text,
        analysis: analysisResult,
        ttsAudioUrl: ttsAudioPath ? `/api/voice/audio/${path.basename(ttsAudioPath)}` : null,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Voice command processing failed'
    });
  }
});

/**
 * TTS 오디오 파일 제공
 * GET /api/voice/audio/:filename
 */
router.get('/audio/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const audioPath = path.join(__dirname, '../uploads/voice', filename);
    
    // 파일 존재 확인
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({
        success: false,
        error: 'Audio file not found'
      });
    }
    
    // 오디오 파일 스트리밍
    res.setHeader('Content-Type', voiceService.getAudioMimeType(audioPath));
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    const stream = fs.createReadStream(audioPath);
    stream.pipe(res);
    
    // 스트리밍 완료 후 파일 정리
    stream.on('end', () => {
      voiceService.cleanupAudioFile(audioPath);
    });
    
  } catch (error) {
    logger.error('Audio file serving error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve audio file'
    });
  }
});

/**
 * 음성 처리 상태 확인
 * GET /api/voice/status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'active',
      supportedFormats: ['wav', 'mp3', 'ogg', 'm4a', 'webm'],
      maxFileSize: '10MB',
      timeout: config.voice.timeout,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * AI 모델 상태 확인
 * GET /api/voice/ai-status
 */
router.get('/ai-status', (req, res) => {
  try {
    const status = aiService.getServiceStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('AI 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI service status'
    });
  }
});

/**
 * AI 모델 테스트
 * POST /api/voice/test-ai
 */
router.post('/test-ai', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for AI testing'
      });
    }

    logger.info('🧪 AI 모델 테스트 시작:', { text });

    // 메뉴 데이터 로드
    const menuData = await menuService.getMenuData();
    
    // AI 분석 테스트
    const analysisResult = await aiService.analyzeOrderIntent(text, menuData, { currentPage: 'test' });
    
    logger.info('🧪 AI 모델 테스트 완료:', { 
      input: text,
      result: analysisResult 
    });

    res.json({
      success: true,
      data: {
        input: text,
        analysis: analysisResult,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('🧪 AI 모델 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: 'AI model test failed',
      details: error.message
    });
  }
});

module.exports = router;
