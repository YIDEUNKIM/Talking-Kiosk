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
    res.status(500).json({
      success: false,
      error: 'Voice processing failed'
    });
  }
});

/**
 * 텍스트 입력을 통한 주문 처리
 * POST /api/voice/process
 */
router.post('/process', async (req, res) => {
  try {
    const { text, context } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'No text provided'
      });
    }

    logger.info('Voice text processing:', { text, context });

    // 메뉴 데이터 로드
    const menuData = await menuService.getMenuData();
    
    // AI를 통한 의도 분석
    const analysisResult = await aiService.analyzeIntent(text, menuData, context || {});
    
    logger.info('AI analysis result:', analysisResult);

    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    logger.error('Voice processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Voice processing failed'
    });
  }
});

/**
 * 음성 처리 상태 확인
 * GET /api/voice/status
 */
router.get('/status', (req, res) => {
  try {
    const status = voiceService.getServiceStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Voice status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voice service status'
    });
  }
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
    logger.error('AI status check failed:', error);
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
        error: 'No text provided for testing'
      });
    }

    logger.info('AI model test request:', { text });

    // 메뉴 데이터 로드
    const menuData = await menuService.getMenuData();
    
    // AI 분석 테스트
    const analysisResult = await aiService.analyzeIntent(text, menuData, { currentPage: 'test' });
    
    logger.info('AI test result:', analysisResult);

    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    logger.error('AI model test failed:', error);
    res.status(500).json({
      success: false,
      error: 'AI model test failed',
      details: error.message
    });
  }
});

module.exports = router;

