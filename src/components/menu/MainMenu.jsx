import { useNavigate } from 'react-router-dom';
import { useMultiplayer } from '../../contexts/MultiplayerContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from '../../styles/components/menu/MainMenu.module.css';
import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from '../../store/store';
import { gameActions, physicsActions, systemActions } from '../../store/actions';
import { usePhysics } from '../../hooks/usePhysics';
import Logger from '../../utils/logger';

export function MainMenu() {
  const navigate = useNavigate();
  const { nickname } = useMultiplayer();
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const gameStatus = useSelector(state => state.game.status);
  const { resetPhysics } = usePhysics();

  // Reset state when entering menu
  useEffect(() => {
    Logger.info('MainMenu', 'Initializing menu state');
    
    // Ensure we're in idle state
    if (gameStatus !== 'idle') {
      dispatch(gameActions.endGame());
      dispatch(physicsActions.resetState());
      resetPhysics();
    }
  }, [gameStatus, dispatch, resetPhysics]);

  const handleStartGame = useCallback(() => {
    Logger.info('MainMenu', 'Starting single player game');
    dispatch(gameActions.startGame('single'));
    navigate('/game');
  }, [dispatch, navigate]);

  const handleMultiplayerClick = useCallback(() => {
    Logger.info('MainMenu', 'Navigating to multiplayer menu');
    navigate('/multiplayer');
  }, [navigate]);

  const handleOptionsClick = useCallback(() => {
    Logger.info('MainMenu', 'Navigating to options menu');
    navigate('/options');
  }, [navigate]);

  return (
    <div className={`${styles.container} ${styles[theme]}`}>
      <h1 className={styles.header}>
        Welcome, <span className={styles.nicknameDisplay}>{nickname || 'Player'}</span>
      </h1>
      <div className={styles.buttonContainer}>
        <button 
          className={`${styles.button} ${styles.primary}`} 
          onClick={handleStartGame}
          disabled={gameStatus !== 'idle'}
        >
          Single Player
        </button>
        <button 
          className={`${styles.button} ${styles.secondary}`} 
          onClick={handleMultiplayerClick}
          disabled={gameStatus !== 'idle'}
        >
          Multiplayer
        </button>
        <button 
          className={`${styles.button} ${styles.tertiary}`} 
          onClick={handleOptionsClick}
        >
          Options
        </button>
      </div>
    </div>
  );
} 