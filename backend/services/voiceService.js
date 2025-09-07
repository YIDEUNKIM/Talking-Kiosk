const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');
const logger = require('../utils/logger');

class VoiceService {
  constructor() {
    this.setupMulter();
  }

  setupMulter() {
    // 음성 파일 업로드를 위한 multer 설정
    this.upload = multer({
      storage: multer.diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = path.join(__dirname, '../uploads/voice');
          fs.ensureDirSync(uploadPath);
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `voice-${uniqueSuffix}.${file.originalname.split('.').pop()}`);
        }
      }),
      limits: {
        fileSize: config.upload.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        // 오디오 파일만 허용
        if (file.mimetype.startsWith('audio/')) {
          cb(null, true);
        } else {
          cb(new Error('Only audio files are allowed'), false);
        }
      }
    });
  }

  /**
   * 음성을 텍스트로 변환 (STT)
   * @param {string} audioFilePath - 오디오 파일 경로
   * @returns {string} 변환된 텍스트
   */
  async speechToText(audioFilePath) {
    try {
      logger.info('Starting STT processing:', { audioFilePath });

      // Hugging Face의 음성 인식 모델 사용
      const response = await this.callHuggingFaceSTT(audioFilePath);
      
      logger.info('STT result:', { text: response });
      return response;
    } catch (error) {
      logger.error('STT processing failed:', error);
      throw new Error('VOICE_PROCESSING_ERROR');
    }
  }

  async callHuggingFaceSTT(audioFilePath) {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(audioFilePath));
      
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${config.ai.huggingfaceApiKey}`
          },
          timeout: config.voice.timeout
        }
      );

      if (response.data && response.data.text) {
        return response.data.text;
      } else {
        throw new Error('No text returned from STT service');
      }
    } catch (error) {
      logger.error('Hugging Face STT error:', error);
      
      // 백업: 간단한 텍스트 반환 (개발용)
      if (config.server.env === 'development') {
        return '개발 모드: 음성 인식 결과';
      }
      
      throw error;
    }
  }

  /**
   * 텍스트를 음성으로 변환 (TTS)
   * @param {string} text - 변환할 텍스트
   * @returns {string} 생성된 오디오 파일 경로
   */
  async textToSpeech(text) {
    try {
      logger.info('Starting TTS processing:', { text });

      const audioFilePath = await this.callHuggingFaceTTS(text);
      
      logger.info('TTS completed:', { audioFilePath });
      return audioFilePath;
    } catch (error) {
      logger.error('TTS processing failed:', error);
      throw new Error('VOICE_PROCESSING_ERROR');
    }
  }

  async callHuggingFaceTTS(text) {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/speecht5_tts',
        {
          inputs: text,
          parameters: {
            voice: config.voice.ttsVoice,
            language: config.voice.language
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.ai.huggingfaceApiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer',
          timeout: config.voice.timeout
        }
      );

      // 오디오 파일 저장
      const audioFileName = `tts-${Date.now()}.wav`;
      const audioFilePath = path.join(__dirname, '../uploads/voice', audioFileName);
      
      await fs.writeFile(audioFilePath, response.data);
      
      return audioFilePath;
    } catch (error) {
      logger.error('Hugging Face TTS error:', error);
      
      // 백업: 더미 오디오 파일 생성 (개발용)
      if (config.server.env === 'development') {
        return this.createDummyAudioFile(text);
      }
      
      throw error;
    }
  }

  /**
   * 개발용 더미 오디오 파일 생성
   * @param {string} text - 텍스트
   * @returns {string} 더미 오디오 파일 경로
   */
  async createDummyAudioFile(text) {
    const audioFileName = `dummy-tts-${Date.now()}.wav`;
    const audioFilePath = path.join(__dirname, '../uploads/voice', audioFileName);
    
    // 간단한 WAV 헤더와 더미 데이터 생성
    const wavHeader = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // "RIFF"
      0x24, 0x00, 0x00, 0x00, // 파일 크기
      0x57, 0x41, 0x56, 0x45, // "WAVE"
      0x66, 0x6D, 0x74, 0x20, // "fmt "
      0x10, 0x00, 0x00, 0x00, // fmt 청크 크기
      0x01, 0x00,             // 오디오 포맷 (PCM)
      0x01, 0x00,             // 채널 수
      0x44, 0xAC, 0x00, 0x00, // 샘플 레이트
      0x88, 0x58, 0x01, 0x00, // 바이트 레이트
      0x02, 0x00,             // 블록 정렬
      0x10, 0x00,             // 비트 깊이
      0x64, 0x61, 0x74, 0x61, // "data"
      0x00, 0x00, 0x00, 0x00  // 데이터 크기
    ]);
    
    // 더미 오디오 데이터 (1초 분량의 무음)
    const dummyData = Buffer.alloc(44100 * 2); // 44.1kHz, 16bit, 1초
    
    const fullBuffer = Buffer.concat([wavHeader, dummyData]);
    await fs.writeFile(audioFilePath, fullBuffer);
    
    return audioFilePath;
  }

  /**
   * 오디오 파일 정리 (임시 파일 삭제)
   * @param {string} filePath - 삭제할 파일 경로
   */
  async cleanupAudioFile(filePath) {
    try {
      if (filePath && await fs.pathExists(filePath)) {
        await fs.remove(filePath);
        logger.info('Audio file cleaned up:', { filePath });
      }
    } catch (error) {
      logger.error('Failed to cleanup audio file:', error);
    }
  }

  /**
   * 오디오 파일의 MIME 타입 반환
   * @param {string} filePath - 파일 경로
   * @returns {string} MIME 타입
   */
  getAudioMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.webm': 'audio/webm'
    };
    
    return mimeTypes[ext] || 'audio/wav';
  }

  /**
   * 음성 파일 유효성 검사
   * @param {string} filePath - 파일 경로
   * @returns {boolean} 유효성 여부
   */
  async validateAudioFile(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      // 파일 크기 검사 (10MB 제한)
      if (stats.size > config.upload.maxFileSize) {
        return false;
      }
      
      // 파일 존재 여부 검사
      return stats.isFile();
    } catch (error) {
      logger.error('Audio file validation failed:', error);
      return false;
    }
  }
  /**
   * 음성 서비스 상태 확인
   * @returns {Object} 서비스 상태
   */
  getServiceStatus() {
    return {
      status: 'active',
      supportedFormats: ['wav', 'mp3', 'ogg', 'm4a', 'webm'],
      maxFileSize: config.upload.maxFileSize,
      timeout: config.voice.timeout,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new VoiceService();
