import React from 'react';
import '../styles/MainMenu.css';

function MainMenu({ nickname, onMultiplayerClick, onOptionsClick, onSinglePlayerClick }) {
  return (
    <div className="main-menu">
      <div className="nickname-header">
        Playing as: {' '}
        <span 
          className="current-nickname"
          onClick={onOptionsClick}
          title="Click to change nickname"
        >
          {nickname}
        </span>
      </div>
      
      <div className="menu-buttons">
        <button 
          className="menu-button"
          onClick={onSinglePlayerClick}
        >
          Single Player
        </button>
        <button 
          className="menu-button"
          onClick={onMultiplayerClick}
        >
          Multiplayer
        </button>
        <button 
          className="menu-button options-button"
          onClick={onOptionsClick}
        >
          Options
        </button>
      </div>
    </div>
  );
}

export default MainMenu; 