import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useDispatch, useSelector } from '../../store/store.jsx';
import { gameActions, physicsActions, systemActions } from '../../store/actions.jsx';
import { useGameLoop } from '../../hooks/useGameLoop.jsx';
import { GameField } from './GameField';
import { GameControls } from './controls/GameControls';
import { PauseOverlay } from './ui/PauseOverlay';
import { ScoreBoard } from './ui/ScoreBoard';
import { CountdownOverlay } from './ui/CountdownOverlay';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import styles from '../../styles/components/game/GameBoard.module.css';
import Logger from '../../utils/logger';
import performanceMonitor from '../../utils/performance';
import { useNavigate, useLocation } from 'react-router-dom';

// Custom error fallback for GameField
function GameFieldErrorFallback({ error, resetError }) {
  const dispatch = useDispatch();
  
  const handleReset = useCallback(() => {
    dispatch(physicsActions.resetState());
    resetError();
  }, [dispatch, resetError]);

  return (
    <div className={`${styles.errorFallback} ${styles.glass}`}>
      <h3 className={styles.errorTitle}>Game Field Error</h3>
      <p className={styles.errorMessage}>There was a problem rendering the game field.</p>
      <button 
        onClick={handleReset}
        className={styles.resetButton}
      >
        Reset Game Field
      </button>
    </div>
  );
}

export function GameBoard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const initRef = useRef(false);

  // Use separate selectors to prevent unnecessary re-renders
  const mode = useSelector(state => state.game.mode);
  const isStarted = useSelector(state => state.game.isStarted);
  const isPaused = useSelector(state => state.game.isPaused);
  const countdown = useSelector(state => state.game.countdown);
  const winner = useSelector(state => state.game.winner);
  const score = useSelector(state => state.game.score);
  const status = useSelector(state => state.game.status);

  // Initialize game
  useEffect(() => {
    try {
      // Check if we have mode either in state or location
      const gameMode = mode || location.state?.mode;
      
      if (!gameMode) {
        Logger.info('GameBoard', 'No game mode found, returning to menu');
        navigate('/', { replace: true });
        return;
      }

      // Only initialize once and if not already started
      if (!initRef.current && !isStarted) {
        Logger.info('GameBoard', 'Initializing game', { mode: gameMode });
        initRef.current = true;
        dispatch(gameActions.startGame(gameMode));
      }
    } catch (error) {
      Logger.error('GameBoard', 'Error initializing game', error);
      navigate('/', { replace: true });
    }

    // Cleanup on unmount
    return () => {
      if (initRef.current) {
        Logger.info('GameBoard', 'Cleaning up game');
        dispatch(gameActions.endGame());
        initRef.current = false;
      }
    };
  }, [dispatch, navigate, mode, location.state?.mode, isStarted]);

  // Handle countdown
  useEffect(() => {
    if (!isStarted || isPaused || countdown === null || countdown < 0) return;

    const timer = setInterval(() => {
      dispatch(gameActions.updateCountdown(countdown - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isStarted, isPaused, dispatch]);

  // Handle pause/resume
  const handlePause = useCallback(() => {
    if (!isStarted || countdown !== null || winner) return;
    dispatch(gameActions.togglePause());
  }, [isStarted, countdown, winner, dispatch]);

  // Handle game loop
  useGameLoop({
    isActive: isStarted && !isPaused && status === 'playing' && countdown === null,
    onTick: useCallback((deltaTime) => {
      dispatch(physicsActions.updatePhysics(deltaTime));
    }, [dispatch])
  });

  // Show loading state if game hasn't started
  if (!isStarted) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>
          <div className={styles.loadingText}>Loading Game...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameBoard}>
      <ErrorBoundary FallbackComponent={GameFieldErrorFallback}>
        <GameField />
        <ScoreBoard score={score} />
        {isPaused && <PauseOverlay />}
        {countdown !== null && <CountdownOverlay countdown={countdown} />}
        <GameControls 
          onPause={handlePause}
          isPaused={isPaused}
          disabled={!isStarted || countdown !== null || winner !== null}
        />
      </ErrorBoundary>
    </div>
  );
} 