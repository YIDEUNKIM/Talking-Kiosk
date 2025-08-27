import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import menuData from '../data/menu.json';
import VoiceButton from '../components/VoiceButton';
import MenuItem from '../components/MenuItem';
import { useVoice } from '../contexts/VoiceContext';

const MenuContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
  color: white;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  flex: 1;
  margin-bottom: 20px;
`;

const VoiceButtonContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
`;

const MenuPage = () => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState(null);
  const { transcript, speak, isListening } = useVoice();

  // 음성 인식 결과 처리
  useEffect(() => {
    if (transcript) {
      handleVoiceCommand(transcript);
    }
  }, [transcript]);

  const handleVoiceCommand = (command) => {
    const lowerCommand = command.toLowerCase();
    
    // 메뉴 아이템 찾기
    const allItems = menuData.categories.flatMap(category => category.items);
    const foundItem = allItems.find(item => 
      lowerCommand.includes(item.name.toLowerCase()) ||
      lowerCommand.includes(item.id.toLowerCase())
    );

    if (foundItem) {
      speak(`${foundItem.name}를 선택하셨습니다. 옵션을 선택해주세요.`);
      navigate(`/item/${foundItem.id}`);
    } else {
      speak('해당 음료가 존재하지 않습니다. 다시 말씀해주세요.');
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
    navigate(`/item/${item.id}`);
  };

  return (
    <MenuContainer>
      <Header>
        <Title>음성 지원 키오스크</Title>
        <Subtitle>원하시는 음료를 말씀하거나 선택해주세요</Subtitle>
      </Header>

      <MenuGrid>
        {menuData.categories.map(category => (
          <div key={category.id}>
            <h2 style={{ color: 'white', marginBottom: '15px', fontSize: '1.5rem' }}>
              {category.name}
            </h2>
            {category.items.map(item => (
              <MenuItem
                key={item.id}
                item={item}
                onClick={() => handleItemClick(item)}
              />
            ))}
          </div>
        ))}
      </MenuGrid>

      <VoiceButtonContainer>
        <VoiceButton />
      </VoiceButtonContainer>
    </MenuContainer>
  );
};

export default MenuPage; 