import { useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import styles from '../../styles/components/menu/MainMenu.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import themeStyles from '../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../styles/components/shared/Button.module.css';
import inputStyles from '../../styles/components/shared/Input.module.css';
import spacingStyles from '../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../styles/components/shared/Animation.module.css';
import errorStyles from '../../styles/components/shared/Error.module.css';

export function MainMenu() {
  const { state, actions } = useGame();
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');

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
    setNicknameError(validateNickname(value));
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
    // Handle options menu
    console.log('Opening options');
  };

  return (
    <div className={`
      ${layoutStyles.flexColumn}
      ${layoutStyles.itemsCenter}
      ${layoutStyles.justifyCenter}
      ${layoutStyles.fullHeight}
      ${animationStyles.fadeIn}
    `}>
      <div className={`
        ${styles.menuContainer}
        ${themeStyles.glass}
        ${spacingStyles.p6}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${spacingStyles.gap4}
      `}>
        <h1 className={`
          ${typographyStyles.heading1}
          ${styles.title}
          ${spacingStyles.mb4}
          ${animationStyles.scaleIn}
        `}>
          Playing as: {nickname || 'Guest'}
        </h1>

        <div className={`
          ${styles.nicknameSection}
          ${layoutStyles.flexColumn}
          ${layoutStyles.itemsCenter}
          ${spacingStyles.gap3}
          ${spacingStyles.mb4}
        `}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={15}
            className={`
              ${inputStyles.input}
              ${styles.nicknameInput}
              ${nicknameError ? inputStyles.error : ''}
            `}
          />
          {nicknameError && (
            <div className={errorStyles.error}>
              {nicknameError}
            </div>
          )}
        </div>

        <div className={`
          ${styles.menuOptions}
          ${layoutStyles.flexColumn}
          ${spacingStyles.gap3}
          ${animationStyles.fadeIn}
        `}>
          <button
            onClick={handleStartSinglePlayer}
            className={`
              ${buttonStyles.large}
              ${styles.menuButton}
            `}
            disabled={!nickname || !!nicknameError}
          >
            Single Player
          </button>

          <button
            onClick={handleStartMultiplayer}
            className={`
              ${buttonStyles.large}
              ${styles.menuButton}
            `}
            disabled={!nickname || !!nicknameError}
          >
            Multiplayer
          </button>

          <button
            onClick={handleOpenOptions}
            className={`
              ${buttonStyles.large}
              ${buttonStyles.secondary}
              ${styles.menuButton}
            `}
          >
            Options
          </button>
        </div>
      </div>
    </div>
  );
} 