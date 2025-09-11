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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orders, setOrders] = useState([]);
  const wsRef = useRef(null);
  const navigate = useNavigate();

  // WebSocket 연결 초기화
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket('ws://localhost:3001');
        
        ws.onopen = () => {
          console.log('🔗 [WebSocket] 서버 연결 성공 (ws://localhost:3001)');
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('🔄 [WebSocket] 서버 메시지 수신:', data);
          
          switch (data.type) {
            case 'CONNECTION_SUCCESS':
              console.log('✅ [연결] Web Speech API 음성 시스템 연결 성공');
              break;
            case 'ITEM_ADDED':
              console.log('🛒 [주문] 아이템 추가됨:', data.data);
              setOrders(prev => [...prev, data.data]);
              if (data.response) {
                speak(data.response);
              }
              break;
            case 'ORDER_COMPLETED':
              console.log('✅ [주문] 주문 완료:', data.data);
              if (data.response) {
                speak(data.response);
              }
              
              // 결제 페이지로 자동 이동
              console.log('💳 [결제] 결제 페이지로 자동 이동');
              setTimeout(() => {
                // 서버 응답에서 주문 내역 가져오기 (서버에서 이미 주문이 초기화되었을 수 있음)
                const orderData = data.data;
                const serverItems = orderData?.items || [];
                
                if (serverItems.length === 0) {
                  console.log('⚠️ [결제] 주문 내역이 없어 결제 불가');
                  speak('주문 내역이 없습니다. 먼저 상품을 주문해주세요.');
                  return;
                }
                
                // 서버에서 받은 주문 내역을 결제 페이지 형식으로 변환
                const items = serverItems.map(order => ({
                  id: order.id,
                  name: order.name,
                  price: order.price,
                  cnt: order.quantity,
                  options: {
                    temperature: order.temperature || 'hot',
                    size: order.options?.size || 'regular',
                    shot: order.options?.shot || 'single',
                    sweetness: order.options?.sweetness || 'none',
                    milk: order.options?.milk || 'whole'
                  }
                }));
                
                console.log('💳 [결제] 서버에서 받은 주문 내역 전달:', items);
                console.log('💰 [결제] 총 금액:', orderData.total + '원');
                
                // 주문 완료 후 로컬 주문 목록도 초기화
                setOrders([]);
                
                navigate("/payment", { state: { items } });
              }, 2000); // 음성 응답 후 2초 뒤 이동
              break;
            case 'VOICE_ERROR':
              console.error('❌ [오류] 음성 오류:', data.message);
              if (data.response) {
                speak(data.response);
              }
              setIsListening(false);
              setIsSpeaking(false);
              break;
            default:
              console.log('❓ [알 수 없음] 처리되지 않은 메시지 타입:', data.type);
              break;
          }
        };
        
        ws.onclose = () => {
          console.log('🔌 [WebSocket] 서버 연결 해제됨');
          setIsConnected(false);
          // 재연결 시도
          console.log('🔄 [WebSocket] 3초 후 재연결 시도...');
          setTimeout(connectWebSocket, 3000);
        };
        
        ws.onerror = (error) => {
          console.error('❌ [WebSocket] 연결 오류:', error);
          setIsConnected(false);
        };
        
        wsRef.current = ws;
      } catch (error) {
        console.error('WebSocket 연결 실패:', error);
        setIsConnected(false);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 음성 인식 초기화
  const initializeSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ko-KR';
      
      recognition.onstart = () => {
        console.log('🎤 [음성 인식] 시작됨');
        setIsListening(true);
        setTranscript('');
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 [사용자 입력] 음성 인식 결과:', transcript);
        setTranscript(transcript);
        setIsListening(false);
        
        // 음성 명령을 서버로 전송
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('📤 [WebSocket] 음성 명령 전송:', transcript);
          wsRef.current.send(JSON.stringify({
            type: 'VOICE_COMMAND',
            transcript: transcript
          }));
        }
      };
      
      recognition.onerror = (event) => {
        console.error('❌ [음성 인식] 오류:', event.error);
        setIsListening(false);
        speak('음성 인식에 오류가 발생했습니다. 다시 시도해주세요.');
      };
      
      recognition.onend = () => {
        console.log('🛑 [음성 인식] 종료됨');
        setIsListening(false);
      };
      
      setRecognition(recognition);
      return recognition;
    } else {
      console.error('❌ [음성 인식] Web Speech API를 지원하지 않는 브라우저입니다');
      speak('죄송합니다. 이 브라우저는 음성 인식을 지원하지 않습니다.');
      return null;
    }
  }, []);

  // Web Speech API 음성 인식 시작
  const startListening = useCallback(() => {
    if (isListening) {
      console.log('⚠️ [음성 인식] 이미 음성 인식이 진행 중입니다');
      return;
    }

    if (!isConnected) {
      console.error('❌ [음성 인식] 서버에 연결되지 않았습니다');
      speak('서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    if (recognition) {
      console.log('🎤 [음성 인식] 시작 요청');
      recognition.start();
    } else {
      console.log('🎤 [음성 인식] 초기화 후 시작');
      const newRecognition = initializeSpeechRecognition();
      if (newRecognition) {
        newRecognition.start();
      }
    }
  }, [recognition, initializeSpeechRecognition, isListening, isConnected]);

  // Web Speech API 음성 인식 중지
  const stopListening = useCallback(() => {
    if (!isListening) {
      console.log('⚠️ [음성 인식] 음성 인식이 진행 중이지 않습니다');
      return;
    }
    
    if (recognition) {
      console.log('🛑 [음성 인식] 중지 요청');
      recognition.stop();
    }
  }, [recognition, isListening]);

  // Web Speech API 음성 합성 (TTS)
  const speak = useCallback((text) => {
    if ('speechSynthesis' in window) {
      console.log('🔊 [음성 합성] TTS 시작:', text);
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      
      utterance.onend = () => {
        console.log('✅ [음성 합성] TTS 완료');
        setIsSpeaking(false);
      };
      
      utterance.onerror = (event) => {
        console.error('❌ [음성 합성] TTS 오류:', event);
        setIsSpeaking(false);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      console.error('❌ [음성 합성] Web Speech API TTS를 지원하지 않는 브라우저입니다');
    }
  }, []);

  // 음성 합성 중지
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      console.log('🛑 [음성 합성] TTS 중지');
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // 주문 초기화 함수
  const clearOrders = useCallback(() => {
    setOrders([]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'CLEAR_ORDERS'
      }));
    }
  }, []);

  // 수동으로 아이템 추가 (음성 외 방법)
  const addItemToCart = useCallback((item) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('📤 [수동 주문] 아이템 추가 요청:', item);
      wsRef.current.send(JSON.stringify({
        type: 'VOICE_COMMAND',
        transcript: `${item.name} ${item.quantity || 1}개 주세요`
      }));
    }
  }, []);

  const value = {
    isListening,
    transcript,
    isSpeaking,
    isConnected,
    orders,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    initializeSpeechRecognition,
    clearOrders,
    addItemToCart
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}; 