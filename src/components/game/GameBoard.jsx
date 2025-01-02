import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useDispatch, useSelector } from '../../store/store.jsx';
import { gameActions, physicsActions } from '../../store/actions.jsx';
import { usePhysics } from '../../hooks/usePhysics.jsx';
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
import { useNavigate } from 'react-router-dom';

// Custom error fallback for GameField
const GameFieldErrorFallback = (error, resetError) => (
  <div className={`${styles.errorFallback} ${styles.glass}`}>
    <h3 className={styles.errorTitle}>Game Field Error</h3>
    <p className={styles.errorMessage}>There was a problem rendering the game field.</p>
    <button 
      onClick={resetError}
      className={styles.resetButton}
    >
      Reset Game Field
    </button>
  </div>
);

export function GameBoard() {
  const { 
    isStarted, 
    isPaused, 
    countdown, 
    winner, 
    score, 
    mode,
    status 
  } = useSelector(state => ({
    isStarted: state.game.isStarted,
    isPaused: state.game.isPaused,
    countdown: state.game.countdown,
    winner: state.game.winner,
    score: state.game.score,
    mode: state.game.mode,
    status: state.game.status
  }));
  
  const dispatch = useDispatch();
  const { physics, updatePhysics, movePaddle } = usePhysics();
  const navigate = useNavigate();

  // Initialize game on mount
  useEffect(() => {
    Logger.info('GameBoard', 'Initializing game');
    
    // Only start if we have a mode and aren't already playing
    if (mode && status !== 'playing' && status !== 'starting') {
      dispatch(gameActions.startGame(mode));
    }

    return () => {
      Logger.info('GameBoard', 'Cleaning up game');
      dispatch(gameActions.endGame());
    };
  }, [mode, status]); // Re-run if mode or status changes

  // Countdown management
  useEffect(() => {
    if (!isStarted || countdown === null || countdown < 0 || !mode) return;

    Logger.info('GameBoard', 'Countdown update', { countdown });
    const timer = setTimeout(() => {
      if (countdown > 0) {
        dispatch(gameActions.updateCountdown(countdown - 1));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [isStarted, countdown, mode, dispatch]);

  // Redirect to main menu if no mode is set
  useEffect(() => {
    if (!mode && status === 'idle') {
      Logger.info('GameBoard', 'No game mode set, redirecting to main menu');
      navigate('/');
    }
  }, [mode, status, navigate]);

  // Game loop
  useGameLoop(
    useCallback((deltaTime) => {
      if (!isStarted || isPaused || status !== 'playing') return;
      updatePhysics(deltaTime);
    }, [isStarted, isPaused, status, updatePhysics])
  );

  // Keyboard input state
  const [pressedKeys, setPressedKeys] = useState(new Set());

  // Memoized game state to prevent unnecessary re-renders
  const gameFieldProps = useMemo(() => ({
    ballPosition: physics.ball?.position,
    paddlePositions: {
      left: { y: physics.paddles?.left?.y },
      right: { y: physics.paddles?.right?.y }
    }
  }), [physics.ball?.position, physics.paddles?.left?.y, physics.paddles?.right?.y]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      setPressedKeys(prev => new Set(prev).add(e.key.toLowerCase()));
    };

    const handleKeyUp = (e) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update paddle positions based on keyboard input
  useEffect(() => {
    if (!isStarted || isPaused || countdown) return;

    const updatePaddles = () => {
      const speed = 5;
      if (pressedKeys.has('w')) movePaddle(physics.paddles?.left?.y - speed, 'left');
      if (pressedKeys.has('s')) movePaddle(physics.paddles?.left?.y + speed, 'left');
      if (pressedKeys.has('arrowup')) movePaddle(physics.paddles?.right?.y - speed, 'right');
      if (pressedKeys.has('arrowdown')) movePaddle(physics.paddles?.right?.y + speed, 'right');
    };

    const frameId = requestAnimationFrame(updatePaddles);
    return () => cancelAnimationFrame(frameId);
  }, [isStarted, isPaused, countdown, physics.paddles?.left?.y, physics.paddles?.right?.y, movePaddle, pressedKeys]);

  // Handle pause/resume
  const handlePause = useCallback(() => {
    if (!isStarted || countdown || winner) return;
    Logger.info('GameBoard', 'Game paused/resumed');
    dispatch(gameActions.pauseGame());
  }, [isStarted, countdown, winner, dispatch]);

  // Error handlers
  const handleGameFieldError = useCallback((error) => {
    Logger.error('GameBoard', 'GameField error', { error });
    dispatch(gameActions.pauseGame());
  }, [dispatch]);

  const handleGameFieldReset = useCallback(() => {
    dispatch(gameActions.resumeGame());
  }, [dispatch]);

  return (
    <div className={styles.gameBoard}>
      <ErrorBoundary componentName="ScoreBoard">
        <ScoreBoard score={score} playerName={localStorage.getItem('nickname') || 'Player 1'} />
      </ErrorBoundary>

      <ErrorBoundary
        componentName="GameField"
        onError={handleGameFieldError}
        onReset={handleGameFieldReset}
        fallback={GameFieldErrorFallback}
      >
        <GameField {...gameFieldProps} />
      </ErrorBoundary>

      <ErrorBoundary componentName="GameControls">
        <GameControls 
          onPause={handlePause}
          disabled={!isStarted || !!winner}
          isPaused={isPaused}
        />
      </ErrorBoundary>

      {isPaused && (
        <ErrorBoundary componentName="PauseOverlay">
          <PauseOverlay onResume={handlePause} />
        </ErrorBoundary>
      )}
      
      {countdown > 0 && (
        <ErrorBoundary componentName="CountdownOverlay">
          <CountdownOverlay count={countdown} />
        </ErrorBoundary>
      )}
    </div>
  );
} 