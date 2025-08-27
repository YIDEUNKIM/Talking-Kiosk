import React from 'react';
import styled from 'styled-components';
import { useVoice } from '../contexts/VoiceContext';

const VoiceButtonContainer = styled.button`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  background: ${props => props.isListening ? '#ff4757' : '#2ed573'};
  color: white;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
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

const VoiceButton = () => {
  const { isListening, startListening, stopListening, speak } = useVoice();

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      speak('말씀하세요, 듣고 있습니다.');
      setTimeout(() => {
        startListening();
      }, 1000);
    }
  };

  return (
    <VoiceButtonContainer
      isListening={isListening}
      onClick={handleClick}
      title={isListening ? '음성 인식 중지' : '음성 지원 시작'}
    >
      <MicrophoneIcon />
    </VoiceButtonContainer>
  );
};

export default VoiceButton; 