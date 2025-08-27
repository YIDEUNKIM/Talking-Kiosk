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
    <VoiceProvider>
      <AppContainer>
        <Router>
          <Routes>
            <Route path="/" element={<MenuPage />} />
            <Route path="/item/:itemId" element={<ItemDetailPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/receipt" element={<ReceiptPage />} />
          </Routes>
        </Router>
      </AppContainer>
    </VoiceProvider>
  );
}

export default App; 