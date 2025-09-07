import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VoiceButton from '../components/VoiceButton';
import { useVoice } from '../contexts/VoiceContext';
import './menu.kiosk.css';

const IMG = (id) => {
  const map = {
    1: "ico_drink1.png",          // 아메리카노
    2: "ico_drink2.png",          // 카페라떼
    3: "cafemoca.png",            // 카페모카
    4: "grapefruit_ade.png",      // 자몽에이드
    5: "mango_ade.png",           // 망고에이드
    6: "kiwi_juice.png",          // 키위주스
    7: "peppermint_tea.png",      // 페퍼민트
    8: "Chamomile_tea.png",       // 캐모마일
    9: "peach_tea.png",           // 복숭아티
    10: "cream_rollcake.png",     // 생크림 롤케이크
    11: "cookie_wafle.png",       // 쿠키 크루와상 와플
    12: "basic_wafle.png",        // 크루와상 와플
  };
  return `${process.env.PUBLIC_URL}/menu_images/${map[id]}`;
};

const fmt = (n) => Number(n).toLocaleString("ko-KR");

const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { speak } = useVoice();
  
  const [showSuccess, setShowSuccess] = useState(false);

  const { cart, total, paymentMethod, orderNumber } = location.state || {};

  // 주문 정보가 없으면 메인페이지로 리다이렉트
  if (!cart || cart.length === 0) {
    navigate('/');
    return null;
  }

  const getPaymentMethodName = (method) => {
    return method === 'card' ? '카드 결제' : 'QR 결제';
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleNewOrder = () => {
    navigate('/');
  };

  // 초기 음성 안내
  useEffect(() => {
    speak('결제가 완료되었습니다. 영수증을 확인해주세요.');
    setShowSuccess(true);
  }, []);

  return (
    <div className="wrap">
      <div className="inner">
        <header>
          <a href="#home" className="link_home" onClick={(e) => { e.preventDefault(); handleNewOrder(); }}>
            <span className="ico_cafe">홈으로</span>
          </a>
          <h1>결제 완료</h1>
        </header>

        <main>
          {/* 성공 메시지 */}
          {showSuccess && (
            <div style={{
              textAlign: 'center',
              marginBottom: '30px',
              padding: '20px',
              backgroundColor: '#d4edda',
              border: '2px solid #c3e6cb',
              borderRadius: '10px',
              color: '#155724'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>결제가 완료되었습니다!</div>
            </div>
          )}

          {/* 영수증 */}
          <div className="tab_container">
            <div className="tab_panel on">
              <div className="cont_menus">
                <div style={{
                  backgroundColor: 'white',
                  border: '2px solid #333',
                  borderRadius: '10px',
                  padding: '30px',
                  fontFamily: 'monospace',
                  maxWidth: '500px',
                  margin: '0 auto'
                }}>
                  {/* 영수증 헤더 */}
                  <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '15px' }}>
                    <h2 style={{ fontSize: '1.5rem', margin: '0 0 10px 0' }}>CQC CAFE</h2>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      주소: 서울시 강남구 테헤란로 123<br />
                      전화: 02-1234-5678
                    </div>
                  </div>

                  {/* 주문 정보 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>주문번호:</span>
                      <span>{orderNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>주문시간:</span>
                      <span>{getCurrentTime()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span>결제방법:</span>
                      <span>{getPaymentMethodName(paymentMethod)}</span>
                    </div>
                  </div>

                  {/* 주문 내역 */}
                  <div style={{ borderTop: '1px solid #333', borderBottom: '1px solid #333', padding: '15px 0', marginBottom: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>주문 내역</div>
                    {cart.map((item, index) => (
                      <div key={`${item.id}-${index}`} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        marginBottom: '8px',
                        fontSize: '0.9rem'
                      }}>
                        <span>{item.name} x{item.cnt}</span>
                        <span>{fmt(item.price * item.cnt)}원</span>
                      </div>
                    ))}
                  </div>

                  {/* 총액 */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontWeight: 'bold', 
                    fontSize: '1.1rem',
                    borderTop: '2px solid #333',
                    paddingTop: '10px'
                  }}>
                    <span>총 결제금액:</span>
                    <span>{fmt(total)}원</span>
                  </div>

                  {/* 감사 메시지 */}
                  <div style={{ 
                    textAlign: 'center', 
                    marginTop: '20px', 
                    fontSize: '0.9rem', 
                    color: '#666',
                    borderTop: '1px solid #333',
                    paddingTop: '15px'
                  }}>
                    이용해 주셔서 감사합니다!
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 주문 내역 요약 (큰 화면용) */}
          <div className="tab_container" style={{ marginTop: '30px' }}>
            <div className="tab_panel on">
              <div className="cont_menus">
                <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.5rem', color: '#333' }}>
                  주문 내역
                </h2>
                <ul className="list_menus" style={{ 
                  display: 'block', 
                  gridTemplateColumns: 'none',
                  padding: '20px'
                }}>
                  {cart.map((item, index) => (
                    <li key={`${item.id}-${index}`} style={{ 
                      marginBottom: '15px',
                      border: '1px solid #dcdcdc',
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <div className="link_item" style={{ 
                        cursor: 'default', 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '15px',
                        minHeight: '80px'
                      }}>
                        <img src={IMG(item.id)} className="img_drink" alt="" style={{ 
                          marginRight: '15px',
                          width: '60px',
                          height: '60px',
                          objectFit: 'contain',
                          flexShrink: 0
                        }} />
                        <div style={{ 
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden'
                        }}>
                          <strong className="tit_name" style={{
                            display: 'block',
                            fontSize: '16px',
                            lineHeight: '1.3',
                            color: '#333',
                            marginBottom: '8px',
                            wordBreak: 'keep-all',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.name}
                          </strong>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px'
                          }}>
                            <span style={{ 
                              color: '#666',
                              fontSize: '14px',
                              flex: '1',
                              minWidth: '80px'
                            }}>
                              수량: {item.cnt}개
                            </span>
                            <div className="txt_price" style={{
                              fontSize: '16px',
                              fontWeight: 'bold',
                              color: '#2ed573',
                              flexShrink: 0
                            }}>
                              {fmt(item.price * item.cnt)}원
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div style={{ 
                  textAlign: 'center', 
                  marginTop: '20px', 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '10px',
                  border: '2px solid #2ed573'
                }}>
                  <div style={{ fontSize: '1.2rem', color: '#666', marginBottom: '10px' }}>총 결제 금액</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2ed573' }}>
                    {fmt(total)}원
                  </div>
                  <div style={{ fontSize: '1rem', color: '#666', marginTop: '10px' }}>
                    결제방법: {getPaymentMethodName(paymentMethod)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 그룹 */}
          <div className="group_btn" style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px' }}>
            <a 
              href="#new-order" 
              className="btn_comm btn_comm1" 
              onClick={(e) => { e.preventDefault(); handleNewOrder(); }}
              style={{ flex: 1, maxWidth: '300px' }}
            >
              새 주문하기
            </a>
          </div>
        </main>
      </div>
      
      {/* 음성 버튼 */}
      <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
        <VoiceButton />
      </div>
    </div>
  );
};

export default ReceiptPage;