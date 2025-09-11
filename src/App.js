import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import MenuPage from './pages/MenuPage';
import ItemDetailPage from './pages/ItemDetailPage';
import PaymentPage from './pages/PaymentPage';
import ReceiptPage from './pages/ReceiptPage';
import { VoiceProvider } from './contexts/VoiceContext';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

function App() {
  return (
    <Router>  {/* ✅ Router가 가장 바깥으로 이동 */}
      <VoiceProvider>  {/* ✅ VoiceProvider가 Router 안쪽에 위치 */}
        <AppContainer>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/item/:itemId" element={<ItemDetailPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/receipt" element={<ReceiptPage />} />
          </Routes>
        </AppContainer>
      </VoiceProvider>
    </Router>
  );
}

export default App;