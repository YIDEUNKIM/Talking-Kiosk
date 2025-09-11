import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ 라우팅 훅
import VoiceButton from "../components/VoiceButton";
import { useVoice } from "../contexts/VoiceContext";
import "./menu.kiosk.css";

const fmt = (n) => Number(n).toLocaleString("ko-KR");

// 환경변수에서 API URL 가져오기
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function MenuPage() {
  const [tabIdx, setTabIdx] = useState(0);
  const [cart, setCart] = useState([]);
  const [popup, setPopup] = useState(null);
  const [layerOpen, setLayerOpen] = useState(true);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedOrders, setProcessedOrders] = useState(new Set()); // ✅ 처리된 주문 ID 추적

  const navigate = useNavigate(); // ✅ 라우팅 훅
  const { currentOrder } = useVoice(); // ✅ 음성 주문 상태 구독

  // 백엔드에서 메뉴 데이터 가져오기
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/menu`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setMenuData(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch menu data');
        }
      } catch (err) {
        console.error('메뉴 데이터 로드 실패:', err);
        setError(err.message);
        // 백업으로 로컬 데이터 사용
        try {
          const localData = await import('../data/menu.json');
          setMenuData(localData.default);
        } catch (localErr) {
          console.error('로컬 메뉴 데이터도 로드 실패:', localErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // 음성 주문이 있을 때 장바구니에 추가
  useEffect(() => {
    if (currentOrder && currentOrder.items && currentOrder.items.length > 0) {
      // 이미 처리된 주문인지 확인
      if (processedOrders.has(currentOrder.id)) {
        console.log('🔄 이미 처리된 주문입니다:', currentOrder.id);
        return;
      }

      console.log('🎯 음성 주문 감지됨, 장바구니에 추가:', currentOrder.items);
      
      // 음성 주문 아이템들을 기존 장바구니 형식으로 변환
      const voiceOrderItems = currentOrder.items.map(item => {
        // 메뉴 데이터에서 실제 가격 찾기
        let actualPrice = 0;
        if (menuData && menuData.categories) {
          for (const category of menuData.categories) {
            if (category.items) {
              const menuItem = category.items.find(menu => 
                menu.id === (item.menuId || item.id)
              );
              if (menuItem) {
                actualPrice = menuItem.price;
                break;
              }
            }
          }
        }
        
        const cartItem = {
          id: item.menuId || item.id,
          name: item.name,
          price: actualPrice || item.price || 0, // 메뉴 데이터의 실제 가격 사용
          quantity: item.quantity || 1,
          temp: item.options?.temperature === 'hot' ? 'hot' : 'ice',
          size: item.options?.size || 'regular',
          shot: item.options?.shot || 'single',
          milk: item.options?.milk || 'whole',
          sweetness: item.options?.sweetness || 'none'
        };
        
        console.log('🛒 장바구니 아이템 변환:', {
          original: item,
          cartItem: cartItem,
          actualPrice: actualPrice
        });
        
        return cartItem;
      });

      // 기존 장바구니에 추가
      setCart(prevCart => {
        const newCart = [...prevCart];
        voiceOrderItems.forEach(voiceItem => {
          // 같은 아이템이 이미 있는지 확인
          const existingIndex = newCart.findIndex(cartItem => 
            cartItem.id === voiceItem.id && 
            cartItem.temp === voiceItem.temp &&
            cartItem.size === voiceItem.size
          );
          
          if (existingIndex >= 0) {
            // 기존 아이템 수량 증가
            newCart[existingIndex].quantity += voiceItem.quantity;
          } else {
            // 새 아이템 추가
            newCart.push(voiceItem);
          }
        });
        
        console.log('🛒 업데이트된 장바구니:', newCart);
        return newCart;
      });

      // 처리된 주문 ID 추가
      setProcessedOrders(prev => new Set([...prev, currentOrder.id]));
    }
  }, [currentOrder, processedOrders, menuData]);

  const total = useMemo(() => {
    const calculatedTotal = cart.reduce((s, it) => {
      const price = it.price || 0;
      const quantity = it.quantity || it.cnt || 1;
      const itemTotal = price * quantity;
      console.log('💰 총액 계산:', {
        item: it.name,
        price: price,
        quantity: quantity,
        itemTotal: itemTotal
      });
      return s + itemTotal;
    }, 0);
    
    console.log('💰 최종 총액:', calculatedTotal);
    return calculatedTotal;
  }, [cart]);

  const openSelect = (item) => {
    const needsTemp = item.options && item.options.temperature;
    const isCoffee = item.options && (item.options.shot || item.options.milk);
    
    setPopup({
      id: item.id,
      name: item.name,
      unitPrice: item.price,
      cnt: 1,
      temp: needsTemp ? "" : "",
      needsTemp,
      isCoffee,
      size: "",
      shot: "",
      sweetness: "",
      milk: "",
      options: item.options || {},
      defaultOptions: item.defaultOptions || {}
    });
  };

  const changeCnt = (delta) => {
    if (!popup) return;
    const next = Math.max(1, popup.cnt + delta);
    setPopup({ ...popup, cnt: next });
  };

  const chooseTemp = (t) => setPopup((p)=>({...p, temp: t}));
  const chooseSize = (v) => setPopup((p)=>({...p, size: v}));
  const chooseShot = (v) => setPopup((p)=>({...p, shot: v}));
  const chooseSweetness = (v) => setPopup((p)=>({...p, sweetness: v}));
  const chooseMilk = (v) => setPopup((p)=>({...p, milk: v}));

  const addToCart = () => {
    if (!popup) return;
    if (popup.needsTemp && !popup.temp) return;
    if (popup.isCoffee && (!popup.size || !popup.shot || !popup.sweetness || !popup.milk)) return;
    if (cart.length >= 3) return;

    const selectedOptions = {
      temperature: popup.temp || "",
      size: popup.size || "",
      shot: popup.shot || "",
      sweetness: popup.sweetness || "",
      milk: popup.milk || ""
    };

    const existsIdx = cart.findIndex(
      (c) =>
        c.id === popup.id &&
        JSON.stringify(c.options || {}) === JSON.stringify(selectedOptions)
    );

    if (existsIdx >= 0) {
      const next = [...cart];
      next[existsIdx] = { ...next[existsIdx], cnt: next[existsIdx].cnt + popup.cnt };
      setCart(next);
    } else {
      setCart([
        ...cart,
        {
          id: popup.id,
          name: popup.name + (popup.temp ? `(${popup.temp})` : ""),
          price: popup.unitPrice,
          cnt: popup.cnt,
          temp: popup.temp || "",
          options: selectedOptions
        }
      ]);
    }
    setPopup(null);
  };

  const cartMinus = (idx) => {
    const next = [...cart];
    const currentQuantity = next[idx].quantity || next[idx].cnt || 1;
    if (currentQuantity > 1) {
      if (next[idx].quantity !== undefined) {
        next[idx].quantity -= 1;
      } else {
        next[idx].cnt -= 1;
      }
    }
    setCart(next);
  };
  const cartPlus = (idx) => {
    const next = [...cart];
    if (next[idx].quantity !== undefined) {
      next[idx].quantity += 1;
    } else {
      next[idx].cnt += 1;
    }
    setCart(next);
  };
  const cartDelete = (idx) => {
    const next = [...cart];
    next.splice(idx,1);
    setCart(next);
  };
  const resetAll = () => {
    setCart([]);
    setPopup(null);
    setTabIdx(0);
  };

  // ✅ 결제 페이지로 이동: 장바구니 전체를 items 배열로 전달
  const gotoPayment = () => {
    if (cart.length === 0) return;

    const toLower = (v) => (v ? String(v).toLowerCase() : "");

    const items = cart.map((c) => ({
      id: c.id,
      name: c.name,                 // 카트표시명 유지 (옵션은 별도 표시되므로 안전)
      price: Number(c.price || 0),  // 단가
      cnt: Number(c.quantity || c.cnt || 1),      // 수량
      options: {
        temperature: toLower(c.options?.temperature || c.temp || ""),
        size:        toLower(c.options?.size || ""),
        shot:        toLower(c.options?.shot || ""),
        sweetness:   toLower(c.options?.sweetness || ""),
        milk:        toLower(c.options?.milk || "")
      }
    }));

    navigate("/payment", { state: { items } });
  };

  // 로딩 중이거나 메뉴 데이터가 없으면 로딩 표시
  if (loading) {
    return (
      <div className="wrap">
        <div className="inner">
          <header>
            <a href="#home" className="link_home"><span className="ico_cafe">홈으로</span></a>
            <h1>CQC CAFE</h1>
          </header>
          <main>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h2>메뉴를 불러오는 중...</h2>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // 에러가 있거나 메뉴 데이터가 없으면 에러 표시
  if (error || !menuData || !menuData.categories) {
    return (
      <div className="wrap">
        <div className="inner">
          <header>
            <a href="#home" className="link_home"><span className="ico_cafe">홈으로</span></a>
            <h1>CQC CAFE</h1>
          </header>
          <main>
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h2>메뉴를 불러올 수 없습니다</h2>
              <p>{error || '알 수 없는 오류가 발생했습니다.'}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const currentCategory = menuData.categories[tabIdx];
  const currentItems = currentCategory ? currentCategory.items : [];

  return (
    <div className="wrap">
      <div className="inner">
        <header>
          <a href="#home" className="link_home"><span className="ico_cafe">홈으로</span></a>
          <h1>CQC CAFE</h1>
        </header>

        <main>
          <div className="tab_container">
            <ul role="tablist" className="tab_cafe">
              {menuData.categories.map((category, i) => (
                <li role="presentation" key={category.id}>
                  <a
                    href="#tab"
                    role="tab"
                    aria-selected={i===tabIdx ? "true":"false"}
                    onClick={(e)=>{e.preventDefault(); setTabIdx(i);}}
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>

            <div className="tab_panel on">
              <div className="cont_menus">
                <ul className="list_menus">
                  {currentItems.map((item)=>(
                    <li key={item.id}>
                      <a
                        href="#item"
                        className="link_item"
                        data-id={item.id}
                        data-price={item.price}
                        onClick={(e)=>{e.preventDefault(); openSelect(item);}}
                      >
                        <img src={`${process.env.PUBLIC_URL}${item.image}`} className="img_drink" alt={item.name} />
                        <strong className="tit_name">{item.name}</strong>
                        <div className="txt_price">{fmt(item.price)}원</div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="paging_cafe">
                <a href="#p1" className="ico_page active">1</a>
              </div>
            </div>
          </div>

          <div className={`layer_info ${layerOpen ? "open" : ""}`}>
            <div className="inner_layer">
              <a
                href="#toggle"
                className="btn_toggle"
                onClick={(e)=>{e.preventDefault(); setLayerOpen(v=>!v);}}
              >
                <span className="ico_cafe">레이어 열기/닫기</span>
              </a>

              <div className="area_cart on">
                <div className="wrap_cart">
                  <ul className="list_cart">
                    {cart.length === 0 && [0,1,2].map((i)=>(
                      <li key={i}><span className="ico_cafe ico_default"></span></li>
                    ))}
                    {cart.map((c, i)=>(
                      <li key={`${c.id}-${c.temp}-${i}`}>
                        <span className="ico_cafe ico_default"></span>
                        <div className="item_menus" data-id={`id${c.id}`} data-price={c.price}>
                          <img src={`${process.env.PUBLIC_URL}/menu_images/${c.id === 'americano' ? 'ico_drink1.png' : 
                            c.id === 'cafelatte' ? 'ico_drink2.png' :
                            c.id === 'mocha' ? 'cafemoca.png' :
                            c.id === 'grapefruit_ade' ? 'grapefruit_ade.png' :
                            c.id === 'mango_ade' ? 'mango_ade.png' :
                            c.id === 'kiwi_juice' ? 'kiwi_juice.png' :
                            c.id === 'peppermint_tea' ? 'peppermint_tea.png' :
                            c.id === 'chamomile_tea' ? 'Chamomile_tea.png' :
                            c.id === 'peach_tea' ? 'peach_tea.png' :
                            c.id === 'cream_rollcake' ? 'cream_rollcake.png' :
                            c.id === 'cookie_waffle' ? 'cookie_wafle.png' :
                            c.id === 'basic_waffle' ? 'basic_wafle.png' : 'ico_drink1.png'}`} className="img_menus" alt={c.name} />
                          <div className="info_count">
                            <a href="#m" className="ico_cafe ico_minus" onClick={(e)=>{e.preventDefault(); cartMinus(i);}}>-</a>
                            <div className="txt_count">{c.quantity || c.cnt || 1}</div>
                            <a href="#p" className="ico_cafe ico_plus" onClick={(e)=>{e.preventDefault(); cartPlus(i);}}>+</a>
                          </div>
                          <a href="#d" className="btn_delete" onClick={(e)=>{e.preventDefault(); cartDelete(i);}}><span className="ico_cafe">삭제</span></a>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <a href="#prev" className="btn_prev"><span className="ico_cafe">이전</span></a>
                  <a href="#next" className="btn_next"><span className="ico_cafe">다음</span></a>
                </div>

                <div className="box_pay_info active">
                  <div className="group_pay">
                    <div className="txt_pay">
                      총 결제 금액 <em className="txt_num">{fmt(total)}원</em>
                    </div>
                    <a href="#cancel" className="btn_cancel" onClick={(e)=>{e.preventDefault(); resetAll();}}>전체취소</a>
                  </div>

                  {/* 결제하기 → PaymentPage로 이동 */}
                  <a
                    href="#pay"
                    className="btn_pay"
                    onClick={(e)=>{ e.preventDefault(); if (cart.length>0) gotoPayment(); }}
                  >
                    <span className="ico_cafe"></span>결제하기
                  </a>
                </div>
              </div>

            </div>
          </div>

          {popup && (
            <div className="popup_comm popup_select active">
              <div className="popup_body">
                <div className="info_menu">
                  <div className="item_menus">
                    <img src={`${process.env.PUBLIC_URL}/menu_images/${popup.id === 'americano' ? 'ico_drink1.png' : 
                      popup.id === 'cafelatte' ? 'ico_drink2.png' :
                      popup.id === 'mocha' ? 'cafemoca.png' :
                      popup.id === 'grapefruit_ade' ? 'grapefruit_ade.png' :
                      popup.id === 'mango_ade' ? 'mango_ade.png' :
                      popup.id === 'kiwi_juice' ? 'kiwi_juice.png' :
                      popup.id === 'peppermint_tea' ? 'peppermint_tea.png' :
                      popup.id === 'chamomile_tea' ? 'Chamomile_tea.png' :
                      popup.id === 'peach_tea' ? 'peach_tea.png' :
                      popup.id === 'cream_rollcake' ? 'cream_rollcake.png' :
                      popup.id === 'cookie_waffle' ? 'cookie_wafle.png' :
                      popup.id === 'basic_waffle' ? 'basic_wafle.png' : 'ico_drink1.png'}`} className="img_menus" alt={popup.name} />
                    <div className="info_count">
                      <strong className="tit_menus">{popup.name}</strong>
                      <a href="#m" className="ico_cafe ico_minus" onClick={(e)=>{e.preventDefault(); changeCnt(-1);}}>-</a>
                      <div className="txt_count">{popup.cnt}</div>
                      <a href="#p" className="ico_cafe ico_plus" onClick={(e)=>{e.preventDefault(); changeCnt(1);}}>+</a>
                    </div>
                  </div>
                  <div className="item_price">{fmt(popup.unitPrice * popup.cnt)}원</div>
                </div>

                {popup.needsTemp && (
                  <div className="select_temp">
                    <a
                      href="#hot"
                      className={popup.temp === "HOT" ? "on":""}
                      onClick={(e)=>{e.preventDefault(); chooseTemp("HOT");}}
                    >HOT</a>
                    <a
                      href="#ice"
                      className={popup.temp === "ICE" ? "on":""}
                      onClick={(e)=>{e.preventDefault(); chooseTemp("ICE");}}
                    >ICE</a>
                  </div>
                )}

                {popup.isCoffee && (
                  <>
                    <div className="select_temp">
                      <a href="#regular" className={popup.size === "regular" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseSize("regular");}}>레귤러</a>
                      <a href="#large" className={popup.size === "large" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseSize("large");}}>라지</a>
                    </div>

                    <div className="select_temp">
                      <a href="#single" className={popup.shot === "single" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseShot("single");}}>싱글샷</a>
                      <a href="#double" className={popup.shot === "double" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseShot("double");}}>더블샷</a>
                    </div>

                    <div className="select_temp">
                      <a href="#none" className={popup.sweetness === "none" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseSweetness("none");}}>당도 없음</a>
                      <a href="#less" className={popup.sweetness === "less" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseSweetness("less");}}>당도 적게</a>
                      <a href="#normal" className={popup.sweetness === "normal" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseSweetness("normal");}}>당도 보통</a>
                      <a href="#more" className={popup.sweetness === "more" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseSweetness("more");}}>당도 많이</a>
                    </div>

                    <div className="select_temp">
                      <a href="#whole" className={popup.milk === "whole" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseMilk("whole");}}>전지유</a>
                      <a href="#skim" className={popup.milk === "skim" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseMilk("skim");}}>저지방유</a>
                      <a href="#oat" className={popup.milk === "oat" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseMilk("oat");}}>오트밀크</a>
                      <a href="#almond" className={popup.milk === "almond" ? "on":""}
                         onClick={(e)=>{e.preventDefault(); chooseMilk("almond");}}>아몬드밀크</a>
                    </div>
                  </>
                )}

                <div className="group_btn">
                  <a href="#cancel" className="btn_comm btn_comm2" onClick={(e)=>{e.preventDefault(); setPopup(null);}}>취소</a>
                  <a
                    href="#ok"
                    className={`btn_comm btn_comm1 ${
                      (popup.needsTemp && !popup.temp) ||
                      (popup.isCoffee && (!popup.size || !popup.shot || !popup.sweetness || !popup.milk))
                        ? "disabled":""
                    }`}
                    onClick={(e)=>{
                      e.preventDefault();
                      const invalid =
                        (popup.needsTemp && !popup.temp) ||
                        (popup.isCoffee && (!popup.size || !popup.shot || !popup.sweetness || !popup.milk));
                      if (!invalid) addToCart();
                    }}
                  >
                    선택완료
                  </a>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
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
    </div>
  );
}
