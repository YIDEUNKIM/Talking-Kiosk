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

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { transcript, speak, isListening } = useVoice();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { cart, total } = location.state || {};

  // 장바구니가 없으면 메인페이지로 리다이렉트
  if (!cart || cart.length === 0) {
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
    
    if (lowerCommand.includes('카드') || lowerCommand.includes('card')) {
      setSelectedPaymentMethod('card');
      speak('카드 결제를 선택하셨습니다.');
    } else if (lowerCommand.includes('qr') || lowerCommand.includes('큐알')) {
      setSelectedPaymentMethod('qr');
      speak('QR 결제를 선택하셨습니다.');
    } else {
      speak('카드 결제 또는 QR 결제 중에서 선택해주세요.');
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    if (method === 'card') {
      speak('카드 결제를 선택하셨습니다.');
    } else {
      speak('QR 결제를 선택하셨습니다.');
    }
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) return;
    
    setIsProcessing(true);
    speak('결제가 진행 중입니다. 잠시만 기다려주세요.');
    
    // 결제 시뮬레이션
    setTimeout(() => {
      speak('결제가 완료되었습니다.');
      setTimeout(() => {
        navigate('/receipt', { 
          state: { 
            cart, 
            total,
            paymentMethod: selectedPaymentMethod,
            orderNumber: `ORDER-${Date.now().toString().slice(-6)}`
          } 
        });
      }, 2000);
    }, 3000);
  };

  const handleBack = () => {
    navigate(-1);
  };

  // 초기 음성 안내
  useEffect(() => {
    speak('결제 방법을 선택해주세요. 카드 결제 또는 QR 결제 중에서 선택하세요.');
  }, []);

  return (
    <div className="wrap">
      <div className="inner">
        <header>
          <a href="#home" className="link_home" onClick={(e) => { e.preventDefault(); handleBack(); }}>
            <span className="ico_cafe">홈으로</span>
          </a>
          <h1>결제하기</h1>
        </header>

        <main>
          {/* 주문 내역 */}
          <div className="tab_container">
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
                </div>
              </div>
            </div>
          </div>

          {/* 결제 방법 선택 */}
          <div className="tab_container" style={{ marginTop: '30px' }}>
            <div className="tab_panel on">
              <div className="cont_menus">
                <h2 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.5rem', color: '#333' }}>
                  결제 방법 선택
                </h2>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {/* 카드 결제 */}
                  <div 
                    className={`link_item ${selectedPaymentMethod === 'card' ? 'selected' : ''}`}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '30px', 
                      textAlign: 'center',
                      border: selectedPaymentMethod === 'card' ? '3px solid #2ed573' : '2px solid #ddd',
                      borderRadius: '15px',
                      backgroundColor: selectedPaymentMethod === 'card' ? '#f0fff4' : 'white',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => handlePaymentMethodSelect('card')}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>💳</div>
                    <strong className="tit_name" style={{ fontSize: '1.3rem' }}>카드 결제</strong>
                    <div style={{ marginTop: '10px', color: '#666' }}>신용카드로 결제</div>
                  </div>

                  {/* QR 결제 */}
                  <div 
                    className={`link_item ${selectedPaymentMethod === 'qr' ? 'selected' : ''}`}
                    style={{ 
                      cursor: 'pointer', 
                      padding: '30px', 
                      textAlign: 'center',
                      border: selectedPaymentMethod === 'qr' ? '3px solid #2ed573' : '2px solid #ddd',
                      borderRadius: '15px',
                      backgroundColor: selectedPaymentMethod === 'qr' ? '#f0fff4' : 'white',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => handlePaymentMethodSelect('qr')}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📱</div>
                    <strong className="tit_name" style={{ fontSize: '1.3rem' }}>QR 결제</strong>
                    <div style={{ marginTop: '10px', color: '#666' }}>QR코드로 결제</div>
                  </div>
                </div>

                {/* 버튼 그룹 */}
                <div className="group_btn" style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <a 
                    href="#back" 
                    className="btn_comm btn_comm2" 
                    onClick={(e) => { e.preventDefault(); handleBack(); }}
                    style={{ flex: 1, maxWidth: '200px' }}
                  >
                    뒤로가기
                  </a>
                  <a 
                    href="#pay" 
                    className={`btn_comm btn_comm1 ${!selectedPaymentMethod ? 'disabled' : ''}`}
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (selectedPaymentMethod) handlePayment(); 
                    }}
                    style={{ 
                      flex: 1, 
                      maxWidth: '200px',
                      opacity: !selectedPaymentMethod ? 0.5 : 1,
                      cursor: !selectedPaymentMethod ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isProcessing ? '결제 중...' : '결제하기'}
                  </a>
                </div>
              </div>
            </div>
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

export default PaymentPage;