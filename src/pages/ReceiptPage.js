import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useVoice } from '../contexts/VoiceContext';

const ReceiptContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f8f9fa;
`;

const ReceiptCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const ReceiptHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #2ed573;
`;

const ReceiptTitle = styled.h1`
  font-size: 2rem;
  color: #333;
  margin-bottom: 10px;
`;

const ReceiptSubtitle = styled.p`
  font-size: 1rem;
  color: #666;
`;

const ReceiptContent = styled.div`
  margin-bottom: 30px;
`;

const ReceiptRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
`;

const ReceiptLabel = styled.span`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const ReceiptValue = styled.span`
  font-size: 1rem;
  color: #2ed573;
  font-weight: bold;
`;

const ReceiptTotal = styled.div`
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

const ThankYouMessage = styled.div`
  text-align: center;
  margin-top: 20px;
  padding: 20px;
  background: #e8f5e8;
  border-radius: 15px;
  border-left: 4px solid #2ed573;
`;

const ThankYouText = styled.p`
  font-size: 1.2rem;
  color: #2ed573;
  font-weight: bold;
  margin-bottom: 10px;
`;

const ThankYouSubtext = styled.p`
  font-size: 1rem;
  color: #666;
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

const NewOrderButton = styled(Button)`
  background: #2ed573;
  color: white;

  &:hover {
    background: #26d0a8;
  }
`;

const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { speak } = useVoice();

  const { item, selectedOptions, paymentMethod, orderNumber } = location.state || {};

  if (!item) {
    navigate('/');
    return null;
  }

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

  const handleNewOrder = () => {
    navigate('/');
  };

  // 초기 음성 안내
  useEffect(() => {
    speak('주문이 완료되었습니다. 감사합니다. 영수증을 확인해주세요.');
  }, []);

  return (
    <ReceiptContainer>
      <ReceiptCard>
        <ReceiptHeader>
          <ReceiptTitle>주문 완료</ReceiptTitle>
          <ReceiptSubtitle>영수증</ReceiptSubtitle>
        </ReceiptHeader>

        <ReceiptContent>
          <ReceiptRow>
            <ReceiptLabel>주문 번호</ReceiptLabel>
            <ReceiptValue>{orderNumber}</ReceiptValue>
          </ReceiptRow>
          
          <ReceiptRow>
            <ReceiptLabel>주문 시간</ReceiptLabel>
            <ReceiptValue>{new Date().toLocaleString('ko-KR')}</ReceiptValue>
          </ReceiptRow>
          
          <ReceiptRow>
            <ReceiptLabel>상품명</ReceiptLabel>
            <ReceiptValue>{item.name}</ReceiptValue>
          </ReceiptRow>
          
          {Object.entries(selectedOptions || {}).map(([key, value]) => (
            <ReceiptRow key={key}>
              <ReceiptLabel>{key === 'temperature' ? '온도' : 
                              key === 'size' ? '사이즈' : 
                              key === 'shot' ? '샷' : 
                              key === 'sweetness' ? '당도' : 
                              key === 'milk' ? '우유' : key}</ReceiptLabel>
              <ReceiptValue>{getOptionDisplayName(key, value)}</ReceiptValue>
            </ReceiptRow>
          ))}
          
          <ReceiptRow>
            <ReceiptLabel>결제 방법</ReceiptLabel>
            <ReceiptValue>{paymentMethod?.name}</ReceiptValue>
          </ReceiptRow>
        </ReceiptContent>

        <ReceiptTotal>
          <TotalAmount>총 금액: {item.price.toLocaleString()}원</TotalAmount>
        </ReceiptTotal>

        <ThankYouMessage>
          <ThankYouText>주문해주셔서 감사합니다!</ThankYouText>
          <ThankYouSubtext>
            음료가 준비되면 알려드리겠습니다.
            <br />
            주문 번호를 확인해주세요.
          </ThankYouSubtext>
        </ThankYouMessage>

        <ActionButtons>
          <NewOrderButton onClick={handleNewOrder}>
            새 주문하기
          </NewOrderButton>
        </ActionButtons>
      </ReceiptCard>
    </ReceiptContainer>
  );
};

export default ReceiptPage; 