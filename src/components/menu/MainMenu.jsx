import { useState, useEffect } from 'react';
import { useGame } from '../../contexts/GameContext';
import { GameBoard } from '../game/GameBoard';
import { OptionsMenu } from './OptionsMenu';
import { MultiplayerMenu } from './MultiplayerMenu';
import '../../styles/MainMenu.css';
import Logger from '../../utils/logger';

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
    Logger.info('MainMenu', 'Starting single player game');
    // Set mode first
    actions.setMode('single');
    // Small delay to ensure mode is set
    setTimeout(() => {
      actions.startGame('single');
      Logger.debug('MainMenu', 'Game state after starting single player', {
        isGameStarted: state.isGameStarted,
        mode: state.mode
      });
    }, 0);
  };

  const handleStartMultiplayer = () => {
    Logger.info('MainMenu', 'Opening multiplayer menu');
    setCurrentMenu('multiplayer');
  };

  const handleOpenOptions = () => {
    Logger.info('MainMenu', 'Opening options menu');
    setCurrentMenu('options');
  };

  const handleBackToMain = () => {
    Logger.info('MainMenu', 'Returning to main menu');
    // Update nickname when returning from options
    setNickname(localStorage.getItem('nickname') || 'Guest');
    setCurrentMenu('main');
  };

  // If game is started, show the game board
  if (state.isGameStarted) {
    Logger.debug('MainMenu', 'Rendering GameBoard', {
      isGameStarted: state.isGameStarted,
      mode: state.mode
    });
    return <GameBoard />;
  }

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