import React from 'react';
import styled from 'styled-components';
import { useVoice } from '../contexts/VoiceContext';

const VoiceButtonContainer = styled.button`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isListening ? '#ff4757' : '#2ed573'};
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: scale(0.95);
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform 0.3s ease;
  }

  ${props => props.isListening && `
    &::before {
      transform: translate(-50%, -50%) scale(1);
      animation: pulse 1.5s infinite;
    }
    
    animation: listening-bounce 2s infinite;
  `}

  @keyframes pulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }

  @keyframes listening-bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
`;

const MicrophoneIcon = styled.div`
  width: 24px;
  height: 24px;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 4px;
    height: 12px;
    background: currentColor;
    border-radius: 2px;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    border: 3px solid currentColor;
    border-radius: 50%;
    border-top: none;
  }
`;

const ConnectionIndicator = styled.div`
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.isConnected ? '#2ed573' : '#ff4757'};
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  
  ${props => props.isConnected && `
    animation: connection-pulse 2s infinite;
  `}

  @keyframes connection-pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
`;

const VoiceButton = () => {
  const { isListening, isConnected, startListening, stopListening } = useVoice();

  const handleClick = () => {
    console.log('🖱️ [버튼] 음성 버튼 클릭됨, 현재 상태:', { isConnected, isListening });
    
    if (!isConnected) {
      console.error('❌ [버튼] OpenAI 음성 시스템에 연결되지 않음');
      alert('OpenAI 음성 시스템에 연결되지 않았습니다. 서버를 확인해주세요.');
      return;
    }

    if (isListening) {
      console.log('🛑 [버튼] 음성 인식 중지 요청');
      stopListening();
    } else {
      console.log('🎤 [버튼] 음성 인식 시작 요청');
      startListening();
    }
  };

  return (
    <VoiceButtonContainer
      isListening={isListening}
      onClick={handleClick}
      title={
        !isConnected 
          ? 'OpenAI 음성 시스템 연결 안됨' 
          : isListening 
            ? '음성 인식 중지 (클릭)' 
            : '음성 주문 시작 (클릭)'
      }
    >
      <MicrophoneIcon />
      <ConnectionIndicator isConnected={isConnected}>
        {isConnected ? '●' : '×'}
      </ConnectionIndicator>
    </VoiceButtonContainer>
  );
};

export default VoiceButton; 