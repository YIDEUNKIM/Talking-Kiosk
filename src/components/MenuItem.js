import React from 'react';
import styled from 'styled-components';

const ItemContainer = styled.div`
  background: white;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 20px;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const ItemImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
  flex-shrink: 0;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.h3`
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
`;

const ItemDescription = styled.p`
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 10px;
  line-height: 1.4;
`;

const ItemPrice = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  color: #2ed573;
`;

const MenuItem = ({ item, onClick }) => {
  const handleClick = () => {
    onClick(item);
  };

  return (
    <ItemContainer onClick={handleClick}>
      <ItemImage>
        {item.name.charAt(0)}
      </ItemImage>
      <ItemInfo>
        <ItemName>{item.name}</ItemName>
        <ItemDescription>{item.description}</ItemDescription>
        <ItemPrice>{item.price.toLocaleString()}원</ItemPrice>
      </ItemInfo>
    </ItemContainer>
  );
};

export default MenuItem; 