import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from '../../store/store';
import { gameActions, systemActions } from '../../store/actions';
import { useMultiplayerContext } from '../../contexts/MultiplayerContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from '../../styles/components/menu/MainMenu.module.css';
import Logger from '../../utils/logger';

export function MainMenu() {
  const navigate = useNavigate();
  const { nickname } = useMultiplayerContext();
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const handleStartGame = useCallback(() => {
    try {
      // First dispatch game start
      dispatch(gameActions.startGame('single'));
      
      // Then navigate to game route
      navigate('/game', { 
        replace: true,
        state: { mode: 'single' }
      });
      
      Logger.info('MainMenu', 'Starting single player game', { mode: 'single' });
    } catch (error) {
      Logger.error('MainMenu', 'Error starting game', error);
      // Stay on menu if there's an error
    }
  }, [navigate, dispatch]);

  const handleMultiplayerClick = useCallback(() => {
    Logger.info('MainMenu', 'Navigating to multiplayer menu');
    navigate('/multiplayer', { replace: true });
  }, [navigate]);

  const handleOptionsClick = useCallback(() => {
    Logger.info('MainMenu', 'Navigating to options menu');
    navigate('/options', { replace: true });
  }, [navigate]);

  return (
    <div className={styles.pageContainer}>
      <div className={`${styles.menuContainer} ${styles[theme]}`}>
        <h1 className={styles.title}>
          Welcome, <span className={styles.highlight}>{nickname || 'Player'}</span>
        </h1>
        
        <div className={styles.buttonContainer}>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleStartGame}
          >
            Single Player
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleMultiplayerClick}
          >
            Multiplayer
          </button>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleOptionsClick}
          >
            Options
          </button>
        </div>
      </div>
    </div>
  );
} 