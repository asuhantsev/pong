import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { OptionsMenu } from './OptionsMenu';
import { MultiplayerMenu } from './MultiplayerMenu';
import '../../styles/MainMenu.css';

export function MainMenu() {
  const { state, actions } = useGame();
  const [nickname, setNickname] = useState(localStorage.getItem('nickname') || 'Guest');
  const [currentMenu, setCurrentMenu] = useState('main');

  // Update nickname when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setNickname(localStorage.getItem('nickname') || 'Guest');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStartSinglePlayer = () => {
    actions.startGame();
  };

  const handleStartMultiplayer = () => {
    setCurrentMenu('multiplayer');
  };

  const handleOpenOptions = () => {
    setCurrentMenu('options');
  };

  const handleBackToMain = () => {
    // Update nickname when returning from options
    setNickname(localStorage.getItem('nickname') || 'Guest');
    setCurrentMenu('main');
  };

  if (currentMenu === 'options') {
    return <OptionsMenu onBack={handleBackToMain} />;
  }

  if (currentMenu === 'multiplayer') {
    return <MultiplayerMenu onBack={handleBackToMain} />;
  }

  return (
    <div className="main-menu">
      <div className="nickname-header">
        Playing as: <span className="nickname-display">{nickname}</span>
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