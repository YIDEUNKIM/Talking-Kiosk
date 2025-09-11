import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const VoiceContext = createContext();

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export const VoiceProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Refs for cleanup
  const recognitionRef = useRef(null);
  const timeoutRefs = useRef(new Set());
  const utteranceRef = useRef(null);
  const currentOrderRef = useRef(currentOrder);

  // 환경변수에서 API URL 가져오기
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // currentOrder 변경 시 ref 업데이트
  useEffect(() => {
    currentOrderRef.current = currentOrder;
  }, [currentOrder]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 음성 인식 정리
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
          recognitionRef.current = null;
        } catch (e) {
          console.error('음성 인식 정리 중 오류:', e);
        }
      }

      // 타임아웃 정리
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();

      // TTS 정리
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 타임아웃 추가 헬퍼 함수
  const addTimeout = useCallback((callback, delay) => {
    const timeoutId = setTimeout(() => {
      callback();
      timeoutRefs.current.delete(timeoutId);
    }, delay);
    timeoutRefs.current.add(timeoutId);
    return timeoutId;
  }, []);

  // 음성 인식 초기화
  const initializeSpeechRecognition = useCallback(() => {
    // SSR 환경 체크
    if (typeof window === 'undefined') {
      console.error('브라우저 환경이 아닙니다');
      return null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.error('이 브라우저는 음성 인식을 지원하지 않습니다');
        setError('음성 인식이 지원되지 않는 브라우저입니다');
        return null;
      }

      // 이전 인스턴스 정리
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // 이미 중지된 경우 무시
        }
      }

      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
        console.log('🎤 음성 인식 시작됨');
        setIsListening(true);
        setTranscript('');
        setError(null);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const confidence = event.results[0][0].confidence;
        console.log('🎯 음성 인식 결과:', transcript);
        console.log('📊 인식 신뢰도:', (confidence * 100).toFixed(2) + '%');
        
        setTranscript(transcript);
        setLastCommand(transcript);
        setIsListening(false);
        
        // 음성 명령 처리
        processVoiceCommand(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('❌ 음성 인식 오류:', event.error);
        setIsListening(false);
        
        let errorMessage = '음성 인식 중 오류가 발생했습니다';
        switch(event.error) {
          case 'no-speech':
            errorMessage = '음성이 감지되지 않았습니다';
            break;
          case 'audio-capture':
            errorMessage = '마이크를 찾을 수 없습니다';
            break;
          case 'not-allowed':
            errorMessage = '마이크 권한이 거부되었습니다';
            break;
          case 'network':
            errorMessage = '네트워크 오류가 발생했습니다';
            break;
        }
        setError(errorMessage);
      };
      
      recognition.onend = () => {
        console.log('🔚 음성 인식 종료됨');
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
      return recognition;
      
    } catch (error) {
      console.error('음성 인식 초기화 실패:', error);
      setError('음성 인식 초기화에 실패했습니다');
      return null;
    }
  }, []);

  // 음성 인식 시작
  const startListening = useCallback(() => {
    console.log('🚀 음성 인식 시작 요청');
    setError(null);
    
    if (!recognitionRef.current) {
      const recognition = initializeSpeechRecognition();
      if (!recognition) return;
    }
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('음성 인식 시작 실패:', error);
      setError('음성 인식을 시작할 수 없습니다');
      // 재초기화 시도
      const recognition = initializeSpeechRecognition();
      if (recognition) {
        try {
          recognition.start();
        } catch (e) {
          console.error('재시도 실패:', e);
        }
      }
    }
  }, [initializeSpeechRecognition]);

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('음성 인식 중지 실패:', error);
      }
    }
    setIsListening(false);
  }, []);

  // 음성 합성 (TTS)
  const speak = useCallback((text) => {
    console.log('🔊 TTS 시작:', text);
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('TTS가 지원되지 않습니다');
      return;
    }
    
    try {
      // 이전 음성 중지
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onend = () => {
        console.log('🔊 TTS 완료');
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      
      utterance.onerror = (event) => {
        console.error('❌ TTS 오류:', event);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('TTS 실행 실패:', error);
      setIsSpeaking(false);
    }
  }, []);

  // 음성 합성 중지
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
  }, []);

  // 음성 명령 처리 함수
  const processVoiceCommand = useCallback(async (command) => {
    console.log('🧠 음성 명령 처리 시작:', command);
    
    if (isProcessing) {
      console.log('이미 처리 중입니다');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    // 프론트엔드에서 직접 키워드 감지
    const lowerCommand = command.toLowerCase();
    
    // 메뉴 주문 키워드 감지
    if (lowerCommand.includes('아메리카노')) {
      console.log('☕ 아메리카노 주문 감지됨');
      const orderItem = {
        menuId: 'americano',
        name: '아메리카노',
        price: 2500,
        quantity: 1,
        options: { temperature: 'ice' }
      };
      
      const newOrder = {
        id: Date.now(),
        items: [orderItem],
        totalPrice: 2500,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      setCurrentOrder(newOrder);
      speak('아메리카노가 장바구니에 추가되었습니다');
      setIsProcessing(false);
      return;
    }
    
    if (lowerCommand.includes('라떼') || lowerCommand.includes('카페라떼')) {
      console.log('☕ 카페라떼 주문 감지됨');
      const orderItem = {
        menuId: 'cafelatte',
        name: '카페라떼',
        price: 3900,
        quantity: 1,
        options: { temperature: 'hot' }
      };
      
      const newOrder = {
        id: Date.now(),
        items: [orderItem],
        totalPrice: 3900,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      setCurrentOrder(newOrder);
      speak('카페라떼가 장바구니에 추가되었습니다');
      setIsProcessing(false);
      return;
    }
    
    if (lowerCommand.includes('모카') || lowerCommand.includes('카페모카')) {
      console.log('☕ 카페모카 주문 감지됨');
      const orderItem = {
        menuId: 'mocha',
        name: '카페모카',
        price: 4500,
        quantity: 1,
        options: { temperature: 'hot' }
      };
      
      const newOrder = {
        id: Date.now(),
        items: [orderItem],
        totalPrice: 4500,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      
      setCurrentOrder(newOrder);
      speak('카페모카가 장바구니에 추가되었습니다');
      setIsProcessing(false);
      return;
    }
    
    // 결제 관련 키워드 감지
    if (lowerCommand.includes('결제') || lowerCommand.includes('계산') || lowerCommand.includes('돈') || lowerCommand.includes('카드')) {
      console.log('💳 결제 키워드 감지됨');
      speak('결제 페이지로 이동합니다');
      addTimeout(() => {
        // navigate를 안전하게 호출
        try {
          navigate('/payment');
        } catch (error) {
          console.error('네비게이션 오류:', error);
        }
      }, 1000);
      setIsProcessing(false);
      return;
    }
    
    // 완료 관련 키워드 감지
    if (lowerCommand.includes('완료') || lowerCommand.includes('끝') || lowerCommand.includes('그만')) {
      console.log('✅ 완료 키워드 감지됨');
      speak('주문이 완료되었습니다. 영수증 페이지로 이동합니다');
      addTimeout(() => {
        // navigate를 안전하게 호출
        try {
          navigate('/receipt');
        } catch (error) {
          console.error('네비게이션 오류:', error);
        }
      }, 1000);
      setIsProcessing(false);
      return;
    }
    
    try {
      // AbortController로 타임아웃 관리
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 30초 타임아웃
      
      console.log('🚀 백엔드 AI API 호출 시작...');
      const response = await fetch(`${API_URL}/api/voice/test-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: command
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP 오류! 상태: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 백엔드 AI 응답:', result);
      
      if (result?.success && result?.data) {
        const aiResult = result.data;
        console.log('🤖 Gemma AI 분석 결과:', {
          intent: aiResult.intent,
          items: aiResult.items,
          totalPrice: aiResult.totalPrice,
          response: aiResult.response,
          nextAction: aiResult.nextAction
        });
        
        // AI 응답을 TTS로 재생
        if (aiResult.response) {
          console.log('🔊 TTS 재생:', aiResult.response);
          speak(aiResult.response);
        }
        
        // 주문 처리 로직
        if (aiResult.intent === 'order' && Array.isArray(aiResult.items) && aiResult.items.length > 0) {
          console.log('📦 주문 처리 시작:', aiResult.items);
          
          // 주문 항목 검증 및 로그
          const validItems = aiResult.items.filter(item => 
            item && item.name && typeof item.quantity === 'number'
          );
          
          validItems.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name} (${item.quantity}개) - ${item.totalPrice || item.price * item.quantity || '가격 계산 중'}원`);
            if (item.options) {
              console.log(`      옵션:`, item.options);
            }
          });
          
          if (validItems.length > 0) {
            console.log(`💰 총 가격: ${aiResult.totalPrice || 0}원`);
            console.log(`⏭️ 다음 액션: ${aiResult.nextAction}`);
            
            // 주문 상태 업데이트
            const newOrder = {
              id: Date.now(),
              items: validItems.map(item => ({
                ...item,
                id: item.id || `${item.name}-${Date.now()}-${Math.random()}`
              })),
              totalPrice: aiResult.totalPrice || 0,
              status: 'pending',
              timestamp: new Date().toISOString(),
              aiResponse: aiResult
            };
            
            setCurrentOrder(newOrder);
            console.log('💾 주문 상태 저장됨:', newOrder);
            
            // 다음 액션 처리
            handleNextAction(aiResult.nextAction, newOrder);
          }
        }
        
        // 결제 처리
        if (aiResult.intent === 'payment') {
          handlePayment(aiResult);
        }
        
        // 취소 처리
        if (aiResult.intent === 'cancel') {
          handleCancel(aiResult);
        }
        
      } else {
        const errorMsg = result?.error || '알 수 없는 오류가 발생했습니다';
        console.error('❌ AI 분석 실패:', errorMsg);
        setError(errorMsg);
        speak('죄송합니다. 다시 말씀해 주시겠어요?');
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('요청 시간 초과');
        setError('요청 시간이 초과되었습니다');
        speak('응답 시간이 초과되었습니다. 다시 시도해주세요.');
      } else {
        console.error('❌ API 호출 실패:', error);
        setError(error.message);
        speak('시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [API_URL, speak, isProcessing, navigate, addTimeout]);

  // 다음 액션 처리
  const handleNextAction = useCallback((nextAction, order) => {
    console.log('🎯 handleNextAction 호출됨:', { nextAction, order });
    console.log('🧭 navigate 함수 존재 여부:', typeof navigate);
    
    switch(nextAction) {
      case 'confirm':
        console.log('✅ 주문 즉시 확인됨');
        setCurrentOrder(prev => ({ ...prev, status: 'confirmed' }));
        
        addTimeout(() => {
          speak('주문이 확인되었습니다. 결제 페이지로 이동합니다.');
          console.log('💳 결제 페이지로 이동 준비...');
          console.log('🧭 navigate 호출 전');
          try {
            navigate('/payment');
            console.log('🧭 navigate 호출 후');
          } catch (error) {
            console.error('네비게이션 오류:', error);
          }
        }, 2000);
        break;
        
      case 'continue':
        console.log('🔄 주문 계속 진행');
        setCurrentOrder(prev => ({ ...prev, status: 'active' }));
        // 메뉴 페이지에 머물러서 추가 주문 가능
        break;
        
      case 'payment':
        console.log('💳 결제 페이지로 이동');
        setCurrentOrder(prev => ({ ...prev, status: 'confirmed' }));
        addTimeout(() => {
          speak('결제 페이지로 이동합니다.');
          console.log('🧭 payment navigate 호출 전');
          try {
            navigate('/payment');
            console.log('🧭 payment navigate 호출 후');
          } catch (error) {
            console.error('네비게이션 오류:', error);
          }
        }, 1000);
        break;
        
      case 'complete':
        console.log('✅ 주문 완료');
        setCurrentOrder(prev => ({ ...prev, status: 'completed' }));
        addTimeout(() => {
          speak('주문이 완료되었습니다. 영수증 페이지로 이동합니다.');
          console.log('🧭 receipt navigate 호출 전');
          try {
            navigate('/receipt');
            console.log('🧭 receipt navigate 호출 후');
          } catch (error) {
            console.error('네비게이션 오류:', error);
          }
        }, 2000);
        break;
        
      default:
        console.log('알 수 없는 액션:', nextAction);
    }
  }, [addTimeout, speak, navigate]);

  // 결제 처리
  const handlePayment = useCallback((aiResult) => {
    console.log('💳 결제 처리:', aiResult.response);
    const currentOrderSnapshot = currentOrderRef.current;
    
    if (currentOrderSnapshot) {
      setCurrentOrder(prev => ({ ...prev, status: 'paid' }));
      setOrderHistory(prev => [...prev, { ...currentOrderSnapshot, status: 'paid' }]);
      
      addTimeout(() => {
        // 주문을 null로 초기화하지 않고 paid 상태로 유지
        speak('결제가 완료되었습니다. 영수증 페이지로 이동합니다.');
        try {
          navigate('/receipt');
        } catch (error) {
          console.error('네비게이션 오류:', error);
        }
      }, 1000);
    } else {
      speak('결제할 주문이 없습니다.');
    }
  }, [addTimeout, speak, navigate]);

  // 주문 취소
  const handleCancel = useCallback((aiResult) => {
    console.log('❌ 주문 취소:', aiResult.response);
    setCurrentOrder(null);
    speak(aiResult.response || '주문이 취소되었습니다.');
  }, [speak]);

  const value = {
    isListening,
    transcript,
    isSpeaking,
    lastCommand,
    currentOrder,
    orderHistory,
    isProcessing,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    initializeSpeechRecognition,
    processVoiceCommand
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
};