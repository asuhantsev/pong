import { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { OptionsMenu } from './OptionsMenu';
import '../../styles/MainMenu.css';

export function MainMenu() {
  const { state, actions } = useGame();
  const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
  const [nicknameError, setNicknameError] = useState('');
  const [currentMenu, setCurrentMenu] = useState('main');

  const validateNickname = (value) => {
    if (!value.trim()) {
      return 'Nickname is required';
    }
    if (value.length < 3) {
      return 'Nickname must be at least 3 characters';
    }
    if (value.length > 15) {
      return 'Nickname must be less than 15 characters';
    }
    return '';
  };

  const handleNicknameChange = (value) => {
    setNickname(value);
    const error = validateNickname(value);
    setNicknameError(error);
    if (!error) {
      localStorage.setItem('nickname', value);
    }
  };

  const handleStartSinglePlayer = () => {
    if (!nicknameError && nickname) {
      actions.startGame();
    }
  };

  const handleStartMultiplayer = () => {
    if (!nicknameError && nickname) {
      // Handle multiplayer start
      console.log('Starting multiplayer');
    }
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
          {nickname || 'Guest'}
        </span>
      </div>

      <div className="nickname-section">
        <input
          type="text"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          placeholder="Enter your nickname"
          maxLength={15}
          className={`nickname-input ${nicknameError ? 'error' : ''}`}
        />
        {nicknameError && (
          <div className="error-message">
            {nicknameError}
          </div>
        )}
      </div>

      <div className="menu-buttons">
        <button
          onClick={handleStartSinglePlayer}
          className="menu-button"
          disabled={!nickname || !!nicknameError}
        >
          Single Player
        </button>

        <button
          onClick={handleStartMultiplayer}
          className="menu-button"
          disabled={!nickname || !!nicknameError}
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