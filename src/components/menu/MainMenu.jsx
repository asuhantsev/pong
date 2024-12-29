import { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { OptionsMenu } from './OptionsMenu';
import '../../styles/MainMenu.css';

export function MainMenu() {
  const { state, actions } = useGame();
  const [nickname, setNickname] = useState(localStorage.getItem('nickname') || 'Guest');
  const [currentMenu, setCurrentMenu] = useState('main');

  const handleStartSinglePlayer = () => {
    actions.startGame();
  };

  const handleStartMultiplayer = () => {
    // Handle multiplayer start
    console.log('Starting multiplayer');
  };

  const handleOpenOptions = () => {
    setCurrentMenu('options');
  };

  const handleBackToMain = () => {
    setCurrentMenu('main');
  };

  if (currentMenu === 'options') {
    return <OptionsMenu onBack={handleBackToMain} />;
  }

  return (
    <div className="main-menu">
      <div className="nickname-header">
        Playing as: {' '}
        <span className="current-nickname">
          {nickname}
        </span>
      </div>

      <div className="menu-buttons">
        <button
          onClick={handleStartSinglePlayer}
          className="menu-button"
        >
          Single Player
        </button>

        <button
          onClick={handleStartMultiplayer}
          className="menu-button"
        >
          Multiplayer
        </button>

        <button
          onClick={handleOpenOptions}
          className="menu-button options-button"
        >
          Options
        </button>
      </div>
    </div>
  );
} 