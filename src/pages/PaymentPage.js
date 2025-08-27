import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import menuData from '../data/menu.json';
import VoiceButton from '../components/VoiceButton';
import { useVoice } from '../contexts/VoiceContext';

const PaymentContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PaymentCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const OrderSummary = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
`;

const OrderTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
`;

const ItemName = styled.span`
  font-size: 1.1rem;
  color: #333;
  font-weight: 500;
`;

const ItemPrice = styled.span`
  font-size: 1.1rem;
  color: #2ed573;
  font-weight: bold;
`;

const OptionsList = styled.div`
  margin-top: 10px;
  font-size: 0.9rem;
  color: #666;
`;

const TotalPrice = styled.div`
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #2ed573;
`;

const TotalAmount = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2ed573;
`;

const PaymentMethodsContainer = styled.div`
  margin-bottom: 30px;
`;

const PaymentTitle = styled.h3`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const PaymentMethods = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const PaymentMethodButton = styled.button`
  padding: 20px;
  border: 2px solid ${props => props.selected ? '#2ed573' : '#ddd'};
  background: ${props => props.selected ? '#2ed573' : 'white'};
  color: ${props => props.selected ? 'white' : '#333'};
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  &:hover {
    border-color: #2ed573;
    background: ${props => props.selected ? '#2ed573' : '#f8f9fa'};
  }
`;

const PaymentIcon = styled.div`
  font-size: 2rem;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 15px 30px;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const BackButton = styled(Button)`
  background: #6c757d;
  color: white;

  &:hover {
    background: #5a6268;
  }
`;

const PayButton = styled(Button)`
  background: #2ed573;
  color: white;

  &:hover {
    background: #26d0a8;
  }
`;

const VoiceButtonContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
`;

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transcript, speak, isListening } = useVoice();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { item, selectedOptions } = location.state || {};

  if (!item) {
    navigate('/');
    return null;
  }

  // 음성 인식 결과 처리
  useEffect(() => {
    if (transcript && !selectedPaymentMethod) {
      handleVoicePayment(transcript);
    }
  }, [transcript, selectedPaymentMethod]);

  const handleVoicePayment = (command) => {
    const lowerCommand = command.toLowerCase();
    
    // 결제 방법 찾기
    const foundPaymentMethod = menuData.paymentMethods.find(method => 
      lowerCommand.includes(method.name.toLowerCase()) ||
      lowerCommand.includes(method.id.toLowerCase())
    );

    if (foundPaymentMethod) {
      setSelectedPaymentMethod(foundPaymentMethod);
      speak(`${foundPaymentMethod.name}을 선택하셨습니다. 결제를 진행합니다.`);
      
      setTimeout(() => {
        handlePayment();
      }, 2000);
    } else {
      speak('해당하는 결제 방법이 없습니다. 카드 결제 또는 QR 결제 중에서 선택해주세요.');
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePayment = () => {
    setIsProcessing(true);
    speak('결제가 진행 중입니다. 잠시만 기다려주세요.');
    
    // 결제 시뮬레이션
    setTimeout(() => {
      speak('결제가 완료되었습니다. 영수증을 출력합니다.');
      setTimeout(() => {
        navigate('/receipt', { 
          state: { 
            item, 
            selectedOptions, 
            paymentMethod: selectedPaymentMethod,
            orderNumber: generateOrderNumber()
          } 
        });
      }, 2000);
    }, 3000);
  };

  const generateOrderNumber = () => {
    return `ORDER-${Date.now().toString().slice(-6)}`;
  };

  const getOptionDisplayName = (optionKey, option) => {
    const displayNames = {
      temperature: {
        hot: '뜨거운',
        ice: '차가운'
      },
      size: {
        regular: '레귤러',
        large: '라지'
      },
      shot: {
        single: '싱글샷',
        double: '더블샷'
      },
      sweetness: {
        none: '당도 없음',
        less: '당도 적게',
        normal: '당도 보통',
        more: '당도 많이'
      },
      milk: {
        whole: '전지유',
        skim: '저지방유',
        oat: '오트밀크',
        almond: '아몬드밀크'
      }
    };
    
    return displayNames[optionKey]?.[option] || option;
  };

  const handleBack = () => {
    navigate(-1);
  };

  // 초기 음성 안내
  useEffect(() => {
    speak('결제 방법을 선택해주세요. 카드 결제 또는 QR 결제 중에서 선택하세요.');
  }, []);

  return (
    <PaymentContainer>
      <PaymentCard>
        <OrderSummary>
          <OrderTitle>주문 내역</OrderTitle>
          <OrderItem>
            <ItemName>{item.name}</ItemName>
            <ItemPrice>{item.price.toLocaleString()}원</ItemPrice>
          </OrderItem>
          {Object.entries(selectedOptions).length > 0 && (
            <OptionsList>
              {Object.entries(selectedOptions).map(([key, value]) => (
                <div key={key}>
                  {getOptionDisplayName(key, value)}
                </div>
              ))}
            </OptionsList>
          )}
          <TotalPrice>
            <TotalAmount>총 금액: {item.price.toLocaleString()}원</TotalAmount>
          </TotalPrice>
        </OrderSummary>

        <PaymentMethodsContainer>
          <PaymentTitle>결제 방법 선택</PaymentTitle>
          <PaymentMethods>
            {menuData.paymentMethods.map(method => (
              <PaymentMethodButton
                key={method.id}
                selected={selectedPaymentMethod?.id === method.id}
                onClick={() => handlePaymentMethodSelect(method)}
              >
                <PaymentIcon>
                  {method.id === 'card' ? '💳' : '📱'}
                </PaymentIcon>
                {method.name}
              </PaymentMethodButton>
            ))}
          </PaymentMethods>
        </PaymentMethodsContainer>

        <ActionButtons>
          <BackButton onClick={handleBack}>뒤로가기</BackButton>
          <PayButton 
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || isProcessing}
          >
            {isProcessing ? '결제 중...' : '결제하기'}
          </PayButton>
        </ActionButtons>
      </PaymentCard>

      <VoiceButtonContainer>
        <VoiceButton />
      </VoiceButtonContainer>
    </PaymentContainer>
  );
};

export default PaymentPage; 