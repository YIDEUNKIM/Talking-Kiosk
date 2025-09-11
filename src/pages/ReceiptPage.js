import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import menuData from '../data/menu.json';
import VoiceButton from '../components/VoiceButton';

const ReceiptContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ReceiptCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin: 0 0 20px;
  text-align: center;
`;

const Meta = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: 8px;
  column-gap: 8px;
  margin-bottom: 16px;
  font-size: 0.95rem;
  color: #555;
`;

const MetaKey = styled.div`
  color: #888;
`;

const MetaVal = styled.div`
  font-weight: 600;
`;

const OrderSummary = styled.div`
  margin-top: 10px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
`;

const OrderTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 16px;
  text-align: center;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
`;

const ItemName = styled.span`
  font-size: 1rem;
  color: #333;
  font-weight: 500;
`;

const ItemPrice = styled.span`
  font-size: 1rem;
  color: #2ed573;
  font-weight: bold;
`;

const OptionsList = styled.div`
  margin: 6px 0 10px;
  font-size: 0.9rem;
  color: #666;
`;

const TotalPrice = styled.div`
  text-align: center;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 2px solid #2ed573;
`;

const TotalAmount = styled.div`
  font-size: 1.6rem;
  font-weight: bold;
  color: #2ed573;
`;

const Footer = styled.div`
  margin-top: 14px;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
`;

const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 기존 단일 전달 하위호환 포함하여 items 배열로 통일
  const state = location.state || {};
  const { paymentMethod, orderNumber } = state;

  const items = Array.isArray(state.items) && state.items.length > 0
    ? state.items
    : (state.item ? [{
        ...state.item,
        cnt: Number(state.item.cnt || 1),
        options: state.selectedOptions || {}
      }] : []);

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  if (!items || items.length === 0) return null;

  const totalPrice = items.reduce((sum, it) => {
    const unit = Number(it.price || 0);
    const qty  = Number(it.cnt || 1);
    return sum + unit * qty;
  }, 0);

  const getOptionDisplayName = (key, option) => {
    const dict = {
      temperature: { hot: '뜨거운', ice: '차가운' },
      size: { regular: '레귤러', large: '라지' },
      shot: { single: '싱글샷', double: '더블샷' },
      sweetness: { none: '당도 없음', less: '당도 적게', normal: '당도 보통', more: '당도 많이' },
      milk: { whole: '전지유', skim: '저지방유', oat: '오트밀크', almond: '아몬드밀크' },
    };
    const v = String(option ?? '').toLowerCase();
    return dict[key]?.[v] || `${key}: ${option ?? ''}`;
  };

  const paymentMethodName = (() => {
    if (!paymentMethod) return '';
    const found = menuData.paymentMethods?.find(m => m.id === paymentMethod.id) || paymentMethod;
    return found?.name || '';
  })();

  return (
    <ReceiptContainer>
      <ReceiptCard>
        <Title>영수증</Title>

        <Meta>
          <MetaKey>주문번호</MetaKey>
          <MetaVal>{orderNumber || '-'}</MetaVal>
          <MetaKey>결제방법</MetaKey>
          <MetaVal>{paymentMethodName || '-'}</MetaVal>
        </Meta>

        <OrderSummary>
          <OrderTitle>주문 내역</OrderTitle>

          {/* 모든 아이템 + 옵션 출력 */}
          {items.map((it, idx) => (
            <React.Fragment key={`${it.id}-${idx}`}>
              <OrderItem>
                <ItemName>
                  {it.name}{Number(it.cnt || 1) > 1 ? ` x${it.cnt}` : ''}
                </ItemName>
                <ItemPrice>
                  {(Number(it.price || 0) * Number(it.cnt || 1)).toLocaleString()}원
                </ItemPrice>
              </OrderItem>

              {it.options && Object.keys(it.options).length > 0 && (
                <OptionsList>
                  {Object.entries(it.options).map(([k, v]) => (
                    <div key={k}>{getOptionDisplayName(k, v)}</div>
                  ))}
                </OptionsList>
              )}
            </React.Fragment>
          ))}

          <TotalPrice>
            <TotalAmount>총 금액: {totalPrice.toLocaleString()}원</TotalAmount>
          </TotalPrice>
        </OrderSummary>

        <Footer>이용해 주셔서 감사합니다.</Footer>
      </ReceiptCard>
      
      {/* 오른쪽 하단 고정 음성 버튼 */}
      <div style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}>
        <VoiceButton />
      </div>
    </ReceiptContainer>
  );
};

export default ReceiptPage;
