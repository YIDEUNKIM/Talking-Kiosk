import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import menuData from '../data/menu.json';
import VoiceButton from '../components/VoiceButton';
import { useVoice } from '../contexts/VoiceContext';

const DetailContainer = styled.div`
  min-height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ItemCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const ItemHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const ItemName = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 10px;
`;

const ItemDescription = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 20px;
`;

const ItemPrice = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #2ed573;
`;

const OptionsContainer = styled.div`
  margin-bottom: 30px;
`;

const OptionGroup = styled.div`
  margin-bottom: 25px;
`;

const OptionTitle = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const OptionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
`;

const OptionButton = styled.button`
  padding: 12px 20px;
  border: 2px solid ${props => props.selected ? '#2ed573' : '#ddd'};
  background: ${props => props.selected ? '#2ed573' : 'white'};
  color: ${props => props.selected ? 'white' : '#333'};
  border-radius: 10px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #2ed573;
    background: ${props => props.selected ? '#2ed573' : '#f8f9fa'};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
`;

const Button = styled.button`
  padding: 15px 30px;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
`;

const BackButton = styled(Button)`
  background: #6c757d;
  color: white;

  &:hover {
    background: #5a6268;
  }
`;

const OrderButton = styled(Button)`
  background: #2ed573;
  color: white;

  &:hover {
    background: #26d0a8;
  }
`;

const VoiceButtonContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
`;

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { transcript, speak, isListening } = useVoice();
  
  const [selectedOptions, setSelectedOptions] = useState({});
  const [currentOptionGroup, setCurrentOptionGroup] = useState(0);

  // 아이템 찾기
  const allItems = menuData.categories.flatMap(category => category.items);
  const item = allItems.find(item => item.id === itemId);

  if (!item) {
    return <div>아이템을 찾을 수 없습니다.</div>;
  }

  const optionGroups = Object.entries(item.options);
  const currentOptionKey = optionGroups[currentOptionGroup]?.[0];
  const currentOptions = optionGroups[currentOptionGroup]?.[1] || [];

  // 음성 인식 결과 처리
  useEffect(() => {
    if (transcript && currentOptionKey) {
      handleVoiceOption(transcript);
    }
  }, [transcript, currentOptionKey]);

  const handleVoiceOption = (command) => {
    const lowerCommand = command.toLowerCase();
    
    // 현재 옵션 그룹에서 선택 가능한 옵션 찾기
    const foundOption = currentOptions.find(option => {
      const optionName = getOptionDisplayName(currentOptionKey, option);
      return lowerCommand.includes(optionName.toLowerCase()) ||
             lowerCommand.includes(option.toLowerCase());
    });

    if (foundOption) {
      setSelectedOptions(prev => ({
        ...prev,
        [currentOptionKey]: foundOption
      }));
      
      speak(`확인했습니다. ${getOptionDisplayName(currentOptionKey, foundOption)}을 선택하셨습니다.`);
      
      // 다음 옵션 그룹으로 이동
      setTimeout(() => {
        if (currentOptionGroup < optionGroups.length - 1) {
          setCurrentOptionGroup(prev => prev + 1);
          const nextOptionKey = optionGroups[currentOptionGroup + 1][0];
          const nextOptions = optionGroups[currentOptionGroup + 1][1];
          speak(`${getOptionGroupDisplayName(nextOptionKey)}을 선택해주세요. ${nextOptions.map(opt => getOptionDisplayName(nextOptionKey, opt)).join(', ')} 중에서 선택하세요.`);
        } else {
          speak('모든 옵션 선택이 완료되었습니다. 결제 페이지로 이동합니다.');
          setTimeout(() => {
            navigate('/payment', { 
              state: { 
                item, 
                selectedOptions: {
                  ...selectedOptions,
                  [currentOptionKey]: foundOption
                }
              } 
            });
          }, 2000);
        }
      }, 1500);
    } else {
      speak('해당하는 옵션이 없습니다. 다시 말씀해주세요.');
    }
  };

  const getOptionDisplayName = (optionKey, option) => {
    const displayNames = {
      temperature: {
        hot: '뜨거운',
        ice: '차가운'
      },
      size: {
        regular: '레귤러',
        large: '라지'
      },
      shot: {
        single: '싱글샷',
        double: '더블샷'
      },
      sweetness: {
        none: '당도 없음',
        less: '당도 적게',
        normal: '당도 보통',
        more: '당도 많이'
      },
      milk: {
        whole: '전지유',
        skim: '저지방유',
        oat: '오트밀크',
        almond: '아몬드밀크'
      }
    };
    
    return displayNames[optionKey]?.[option] || option;
  };

  const getOptionGroupDisplayName = (optionKey) => {
    const displayNames = {
      temperature: '온도',
      size: '사이즈',
      shot: '샷',
      sweetness: '당도',
      milk: '우유 종류'
    };
    
    return displayNames[optionKey] || optionKey;
  };

  const handleOptionClick = (optionKey, option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [optionKey]: option
    }));
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleOrder = () => {
    navigate('/payment', { state: { item, selectedOptions } });
  };

  // 초기 음성 안내
  useEffect(() => {
    if (currentOptionKey && currentOptions.length > 0) {
      speak(`${getOptionGroupDisplayName(currentOptionKey)}을 선택해주세요. ${currentOptions.map(opt => getOptionDisplayName(currentOptionKey, opt)).join(', ')} 중에서 선택하세요.`);
    }
  }, [currentOptionKey]);

  return (
    <DetailContainer>
      <ItemCard>
        <ItemHeader>
          <ItemName>{item.name}</ItemName>
          <ItemDescription>{item.description}</ItemDescription>
          <ItemPrice>{item.price.toLocaleString()}원</ItemPrice>
        </ItemHeader>

        <OptionsContainer>
          {optionGroups.map(([optionKey, options], index) => (
            <OptionGroup key={optionKey}>
              <OptionTitle>
                {getOptionGroupDisplayName(optionKey)}
                {index === currentOptionGroup && <span style={{color: '#2ed573'}}>●</span>}
              </OptionTitle>
              <OptionButtons>
                {options.map(option => (
                  <OptionButton
                    key={option}
                    selected={selectedOptions[optionKey] === option}
                    onClick={() => handleOptionClick(optionKey, option)}
                  >
                    {getOptionDisplayName(optionKey, option)}
                  </OptionButton>
                ))}
              </OptionButtons>
            </OptionGroup>
          ))}
        </OptionsContainer>

        <ActionButtons>
          <BackButton onClick={handleBack}>뒤로가기</BackButton>
          <OrderButton onClick={handleOrder}>주문하기</OrderButton>
        </ActionButtons>
      </ItemCard>

      <VoiceButtonContainer>
        <VoiceButton />
      </VoiceButtonContainer>
    </DetailContainer>
  );
};

export default ItemDetailPage; 