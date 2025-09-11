import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ 라우팅 훅
import { useVoice } from "../contexts/VoiceContext";
import "./menu.kiosk.css";

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

const CATEGORIES = [
  { key: "추천메뉴", ids: [1,2,3,4,5,6,7,8,9,10,11,12] },
  { key: "커피", ids: [1,2,3] },
  { key: "에이드/주스", ids: [4,5,6] },
  { key: "티", ids: [7,8,9] },
  { key: "디저트", ids: [10,11,12] },
];

const MENU = {
  1: { id:1, name:"아메리카노", price:2500 },
  2: { id:2, name:"카페라떼", price:3900 },
  3: { id:3, name:"카페모카", price:4500 },
  4: { id:4, name:"자몽에이드", price:4500 },
  5: { id:5, name:"망고에이드", price:4500 },
  6: { id:6, name:"키위주스", price:4800 },
  7: { id:7, name:"페퍼민트", price:3500 },
  8: { id:8, name:"캐모마일", price:3500 },
  9: { id:9, name:"복숭아티", price:3500 },
  10:{ id:10, name:"생크림 롤케이크", price:3500 },
  11:{ id:11, name:"쿠키 크루와상 와플", price:4000 },
  12:{ id:12, name:"크루와상 와플", price:2500 },
};

export default function MenuPage() {
  const [tabIdx, setTabIdx] = useState(0);
  const [cart, setCart] = useState([]);
  const [popup, setPopup] = useState(null);
  const [layerOpen, setLayerOpen] = useState(true);

  const navigate = useNavigate(); // ✅ 라우팅 훅
  const { orders, clearOrders, speak } = useVoice();

  // 음성 주문과 수동 주문을 합친 전체 장바구니
  const allItems = useMemo(() => {
    const voiceItems = orders.map(order => ({
      id: order.id,
      name: order.name + (order.temperature === 'ice' ? '(아이스)' : order.temperature === 'hot' ? '(핫)' : ''),
      price: order.price,
      cnt: order.quantity,
      temp: order.temperature === 'ice' ? 'ICE' : 'HOT',
      options: order.options,
      isVoiceOrder: true
    }));
    return [...cart, ...voiceItems];
  }, [cart, orders]);

  const total = useMemo(
    () => allItems.reduce((s, it) => s + it.price * it.cnt, 0),
    [allItems]
  );

  // 음성 주문이 들어오면 자동으로 장바구니 업데이트
  useEffect(() => {
    if (orders.length > 0) {
      console.log('🛒 [메뉴페이지] 음성 주문 업데이트됨:');
      console.table(orders.map(order => ({
        이름: order.name,
        수량: order.quantity,
        온도: order.temperature === 'ice' ? '아이스' : '핫',
        가격: `${order.price}원`,
        시간: new Date(order.timestamp).toLocaleTimeString()
      })));
      
      const totalPrice = orders.reduce((sum, order) => sum + (order.price * order.quantity), 0);
      console.log('💰 [메뉴페이지] 음성 주문 총액:', `${totalPrice.toLocaleString()}원`);
    }
  }, [orders]);

  const openSelect = (id) => {
    const m = MENU[id];
    const needsTemp = !(id >= 10 || (id >= 4 && id <= 6));
    setPopup({
      id: m.id,
      name: m.name,
      unitPrice: m.price,
      cnt: 1,
      temp: needsTemp ? "" : "",
      needsTemp,
      isCoffee: [1,2,3].includes(m.id),
      size: "",
      shot: "",
      sweetness: "",
      milk: ""
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

    const existsIdx = cart.findIndex(
      (c) =>
        c.id === popup.id &&
        c.temp === (popup.temp || "") &&
        JSON.stringify(c.options || {}) === JSON.stringify({
          temperature: popup.temp || "",
          size: popup.size || "",
          shot: popup.shot || "",
          sweetness: popup.sweetness || "",
          milk: popup.milk || ""
        })
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
          options: {
            temperature: popup.temp || "",
            size: popup.size || "",
            shot: popup.shot || "",
            sweetness: popup.sweetness || "",
            milk: popup.milk || ""
          }
        }
      ]);
    }
    setPopup(null);
  };

  const cartMinus = (idx) => {
    const next = [...cart];
    if (next[idx].cnt > 1) next[idx].cnt -= 1;
    setCart(next);
  };
  const cartPlus = (idx) => {
    const next = [...cart];
    next[idx].cnt += 1;
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
    clearOrders(); // 음성 주문도 초기화
    speak('장바구니가 초기화되었습니다.');
  };

  // ✅ 결제 페이지로 이동: 장바구니 전체를 items 배열로 전달
  const gotoPayment = () => {
    if (allItems.length === 0) {
      console.log('⚠️ [결제] 장바구니가 비어있어 결제 불가');
      return;
    }

    console.log('💳 [결제] 결제 페이지로 이동 준비');
    console.log('🛒 [결제] 전체 주문 내역:');
    console.table(allItems.map(item => ({
      이름: item.name,
      수량: item.cnt,
      단가: `${item.price}원`,
      소계: `${item.price * item.cnt}원`,
      타입: item.isVoiceOrder ? '음성주문' : '수동주문'
    })));

    const toLower = (v) => (v ? String(v).toLowerCase() : "");

    const items = allItems.map((c) => ({
      id: c.id,
      name: c.name,                 // 카트표시명 유지 (옵션은 별도 표시되므로 안전)
      price: Number(c.price || 0),  // 단가
      cnt: Number(c.cnt || 1),      // 수량
      options: {
        temperature: toLower(c.options?.temperature || c.temp || ""),
        size:        toLower(c.options?.size || ""),
        shot:        toLower(c.options?.shot || ""),
        sweetness:   toLower(c.options?.sweetness || ""),
        milk:        toLower(c.options?.milk || "")
      }
    }));

    console.log('💰 [결제] 총 결제 금액:', `${total.toLocaleString()}원`);
    speak('결제 페이지로 이동합니다.');
    navigate("/payment", { state: { items } });
  };

  const list = CATEGORIES[tabIdx].ids.map((id) => MENU[id]);

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
              {CATEGORIES.map((c, i) => (
                <li role="presentation" key={c.key}>
                  <a
                    href="#tab"
                    role="tab"
                    aria-selected={i===tabIdx ? "true":"false"}
                    onClick={(e)=>{e.preventDefault(); setTabIdx(i);}}
                  >
                    {c.key}
                  </a>
                </li>
              ))}
            </ul>

            <div className="tab_panel on">
              <div className="cont_menus">
                <ul className="list_menus">
                  {list.map((m)=>(
                    <li key={m.id}>
                      <a
                        href="#item"
                        className="link_item"
                        data-id={m.id}
                        data-price={m.price}
                        onClick={(e)=>{e.preventDefault(); openSelect(m.id);}}
                      >
                        <img src={IMG(m.id)} className="img_drink" alt="" />
                        <strong className="tit_name">{m.name}</strong>
                        <div className="txt_price">{fmt(m.price)}원</div>
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
                    {allItems.length === 0 && [0,1,2].map((i)=>(
                      <li key={i}><span className="ico_cafe ico_default"></span></li>
                    ))}
                    {allItems.map((c, i)=>(
                      <li key={`${c.id}-${c.temp}-${i}`}>
                        <span className="ico_cafe ico_default"></span>
                        <div className="item_menus" data-id={`id${c.id}`} data-price={c.price}>
                          <img src={IMG(c.id)} className="img_menus" alt="" />
                          <div className="info_count">
                            {c.isVoiceOrder ? (
                              // 음성 주문은 수량 변경 불가
                              <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <span style={{color: '#2ed573', fontSize: '12px', fontWeight: 'bold'}}>음성주문</span>
                                <div className="txt_count">{c.cnt}</div>
                              </div>
                            ) : (
                              // 수동 주문은 수량 변경 가능
                              <>
                                <a href="#m" className="ico_cafe ico_minus" onClick={(e)=>{e.preventDefault(); cartMinus(i);}}>-</a>
                                <div className="txt_count">{c.cnt}</div>
                                <a href="#p" className="ico_cafe ico_plus" onClick={(e)=>{e.preventDefault(); cartPlus(i);}}>+</a>
                              </>
                            )}
                          </div>
                          {!c.isVoiceOrder && (
                            <a href="#d" className="btn_delete" onClick={(e)=>{e.preventDefault(); cartDelete(i);}}><span className="ico_cafe">삭제</span></a>
                          )}
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
                    onClick={(e)=>{ e.preventDefault(); if (allItems.length>0) gotoPayment(); }}
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
                    <img src={IMG(popup.id)} className="img_menus" alt="" />
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
    </div>
  );
}
