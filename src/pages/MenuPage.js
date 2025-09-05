import { useMemo, useState } from "react";
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

  const total = useMemo(
    () => cart.reduce((s, it) => s + it.price * it.cnt, 0),
    [cart]
  );

  const openSelect = (id) => {
    const m = MENU[id];
    const needsTemp = !(id >= 10 || (id >= 4 && id <= 6));
    setPopup({
      id: m.id,
      name: m.name,
      unitPrice: m.price,
      cnt: 1,
      temp: needsTemp ? "" : "",
      needsTemp
    });
  };

  const changeCnt = (delta) => {
    if (!popup) return;
    const next = Math.max(1, popup.cnt + delta);
    setPopup({ ...popup, cnt: next });
  };

  const chooseTemp = (t) => {
    if (!popup) return;
    setPopup({ ...popup, temp: t });
  };

  const addToCart = () => {
    if (!popup) return;
    if (popup.needsTemp && !popup.temp) return;
    if (cart.length >= 3) return;
    const existsIdx = cart.findIndex((c) => c.id === popup.id && c.temp === (popup.temp||""));
    if (existsIdx >= 0) {
      const next = [...cart];
      next[existsIdx] = {
        ...next[existsIdx],
        cnt: next[existsIdx].cnt + popup.cnt
      };
      setCart(next);
    } else {
      setCart([
        ...cart,
        {
          id: popup.id,
          name: popup.name + (popup.temp ? `(${popup.temp})` : ""),
          price: popup.unitPrice,
          cnt: popup.cnt,
          temp: popup.temp || ""
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

          <div className="layer_info open">
            <div className="inner_layer">
              <a href="#toggle" className="btn_toggle"><span className="ico_cafe">레이어 열기/닫기</span></a>

              <div className="area_cart on">
                <div className="wrap_cart">
                  <ul className="list_cart">
                    {cart.length === 0 && [0,1,2].map((i)=>(
                      <li key={i}><span className="ico_cafe ico_default"></span></li>
                    ))}
                    {cart.map((c, i)=>(
                      <li key={`${c.id}-${c.temp}`}>
                        <span className="ico_cafe ico_default"></span>
                        <div className="item_menus" data-id={`id${c.id}`} data-price={c.price}>
                          <img src={IMG(c.id)} className="img_menus" alt="" />
                          <div className="info_count">
                            <a href="#m" className="ico_cafe ico_minus" onClick={(e)=>{e.preventDefault(); cartMinus(i);}}>-</a>
                            <div className="txt_count">{c.cnt}</div>
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

                  <a href="#pay" className="btn_pay"><span className="ico_cafe"></span>결제하기</a>
                </div>
              </div>

              <div className="area_options"></div>
              <div className="result_area">
                <dl className="list_result">
                  <dt>주문 금액</dt>
                  <dd className="txt_red">{fmt(total)}원</dd>
                  <dt>할인 금액</dt>
                  <dd className="txt_blue">0원</dd>
                  <dt>결제 금액</dt>
                  <dd>{fmt(total)}원</dd>
                </dl>

                <div className="group_btn">
                  <a href="#all-cancel" className="btn_comm btn_comm3" onClick={(e)=>{e.preventDefault(); resetAll();}}>전체취소</a>
                  <a href="#prev2" className="btn_comm btn_comm2">이전</a>
                  <a href="#next2" className="btn_comm btn_comm1">다음</a>
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

                <div className="group_btn">
                  <a href="#cancel" className="btn_comm btn_comm2" onClick={(e)=>{e.preventDefault(); setPopup(null);}}>취소</a>
                  <a
                    href="#ok"
                    className={`btn_comm btn_comm1 ${popup.needsTemp && !popup.temp ? "disabled":""}`}
                    onClick={(e)=>{e.preventDefault(); if(!(popup.needsTemp && !popup.temp)) addToCart();}}
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
