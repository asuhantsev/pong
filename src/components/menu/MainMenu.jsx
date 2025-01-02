import { useNavigate } from 'react-router-dom';
import { useGame } from '../../contexts/GameContext';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from '../../styles/components/menu/MainMenu.module.css';

export function MainMenu() {
  const navigate = useNavigate();
  const { startGame } = useGame();
  const { nickname } = useMultiplayer();
  const { theme } = useTheme();

  const handleStartGame = () => {
    startGame();
  };

  const handleMultiplayerClick = () => {
    navigate('/multiplayer');
  };

  const handleOptionsClick = () => {
    navigate('/options');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>
        Welcome, <span className={styles.nicknameDisplay}>{nickname}</span>
      </h1>
      <div className={styles.buttonContainer}>
        <button className={styles.button} onClick={handleStartGame}>
          Single Player
        </button>
        <button className={styles.button} onClick={handleMultiplayerClick}>
          Multiplayer
        </button>
        <button 
          className={`${styles.button} ${styles.optionsButton}`} 
          onClick={handleOptionsClick}
        >
          Options
        </button>
      </div>
    </div>
  );
} 