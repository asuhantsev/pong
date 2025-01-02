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

// Custom error fallback for GameField
const GameFieldErrorFallback = (error, resetError) => (
  <div className={styles.errorFallback}>
    <h3>Game Field Error</h3>
    <p>There was a problem rendering the game field.</p>
    <button onClick={resetError}>Reset Game Field</button>
  </div>
);

export function GameBoard() {
  // Memoized selectors for better performance
  const { 
    isStarted, 
    isPaused, 
    countdown, 
    winner, 
    score, 
    mode 
  } = useSelector(state => ({
    isStarted: state.game.isStarted,
    isPaused: state.game.isPaused,
    countdown: state.game.countdown,
    winner: state.game.winner,
    score: state.game.score,
    mode: state.game.mode
  }));
  
  const dispatch = useDispatch();

  // Physics system
  const { 
    physics, 
    updatePhysics, 
    resetBall, 
    resetGame: resetPhysics, 
    movePaddle 
  } = usePhysics();
  
  // Keyboard input state
  const [pressedKeys, setPressedKeys] = useState(new Set());
  
  // Performance optimization refs
  const lastUpdateRef = useRef({ time: 0, position: null, velocity: null });
  const playerNickname = useRef(localStorage.getItem('nickname') || 'Player 1');

  // Memoized game state to prevent unnecessary re-renders
  const gameFieldProps = useMemo(() => ({
    ballPosition: physics.ballPosition,
    paddlePositions: {
      left: physics.leftPaddlePos,
      right: physics.rightPaddlePos
    }
  }), [physics.ballPosition, physics.leftPaddlePos, physics.rightPaddlePos]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.add(e.key.toLowerCase());
        return newKeys;
      });
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
      const speed = 5; // Pixels per frame
      
      // Left paddle (W/S keys)
      if (pressedKeys.has('w')) {
        movePaddle(physics.leftPaddlePos - speed, 'left');
      }
      if (pressedKeys.has('s')) {
        movePaddle(physics.leftPaddlePos + speed, 'left');
      }

      // Right paddle (Arrow keys)
      if (pressedKeys.has('arrowup')) {
        movePaddle(physics.rightPaddlePos - speed, 'right');
      }
      if (pressedKeys.has('arrowdown')) {
        movePaddle(physics.rightPaddlePos + speed, 'right');
      }
    };

    const frameId = requestAnimationFrame(updatePaddles);
    return () => cancelAnimationFrame(frameId);
  }, [isStarted, isPaused, countdown, physics.leftPaddlePos, physics.rightPaddlePos, movePaddle, pressedKeys]);

  // Sync physics state with store
  useEffect(() => {
    if (!physics.ballPosition) return;

    const now = performance.now();
    const position = physics.ballPosition;
    const velocity = physics.ballVelocity;
    const { time, position: lastPos, velocity: lastVel } = lastUpdateRef.current;

    // Only update if significant change or enough time passed
    const shouldUpdate = 
      !lastPos || 
      !lastVel ||
      now - time > 16 ||
      Math.abs(position.x - lastPos.x) > 1 ||
      Math.abs(position.y - lastPos.y) > 1 ||
      Math.abs(velocity.x - lastVel.x) > 0.1 ||
      Math.abs(velocity.y - lastVel.y) > 0.1;

    if (shouldUpdate) {
      dispatch(physicsActions.updateBallPosition(position));
      dispatch(physicsActions.updateBallVelocity(velocity));
      lastUpdateRef.current = { time: now, position, velocity };
    }
  }, [physics.ballPosition, physics.ballVelocity, dispatch]);

  // Handle pause/resume
  const handlePause = useCallback(() => {
    if (!isStarted || countdown || winner) return;
    
    Logger.info('GameBoard', 'Game paused/resumed');
    dispatch(gameActions.pauseGame());
  }, [isStarted, countdown, winner, dispatch]);

  // Game state management
  useEffect(() => {
    if (!isStarted || winner) return;

    Logger.info('GameBoard', 'Game state updated', {
      isStarted,
      countdown,
      mode
    });
    
    if (countdown === 3) {
      Logger.info('GameBoard', 'Initial countdown, resetting physics');
      resetPhysics();
    }
    
    let timer;
    if (countdown) {
      timer = setInterval(() => {
        dispatch(gameActions.updateCountdown(countdown - 1));
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStarted, countdown, mode, winner, dispatch, resetPhysics]);

  // Game loop with performance monitoring
  const gameLoop = useCallback((deltaTime) => {
    performanceMonitor.startMeasure('gameLoop');
    
    if (!isStarted || isPaused || countdown) {
      performanceMonitor.endMeasure('gameLoop', 'game');
      return;
    }

    try {
      updatePhysics(deltaTime);
    } catch (error) {
      Logger.error('GameBoard', 'Error in physics update', { error });
    } finally {
      performanceMonitor.endMeasure('gameLoop', 'game');
    }
  }, [isStarted, isPaused, countdown, updatePhysics]);

  // Start game loop
  useGameLoop(gameLoop);

  // Error handling
  const handleGameFieldError = useCallback((error, errorInfo) => {
    Logger.error('GameBoard', 'GameField error', { error, errorInfo });
    dispatch(gameActions.pauseGame());
  }, [dispatch]);

  const handleScoreBoardError = useCallback((error, errorInfo) => {
    Logger.error('GameBoard', 'ScoreBoard error', { error, errorInfo });
  }, []);

  const handleControlsError = useCallback((error, errorInfo) => {
    Logger.error('GameBoard', 'GameControls error', { error, errorInfo });
  }, []);

  // Reset handlers
  const handleGameFieldReset = useCallback(() => {
    resetPhysics();
    dispatch(gameActions.resumeGame());
  }, [resetPhysics, dispatch]);

  // Cleanup
  useEffect(() => {
    return () => {
      Logger.info('GameBoard', 'Component unmounting, cleaning up');
      performanceMonitor.clearMeasures('gameLoop');
    };
  }, []);

  return (
    <div className={styles.gameBoard}>
      <ErrorBoundary
        componentName="ScoreBoard"
        onError={handleScoreBoardError}
      >
        <ScoreBoard 
          score={score} 
          playerName={playerNickname.current}
        />
      </ErrorBoundary>

      <ErrorBoundary
        componentName="GameField"
        onError={handleGameFieldError}
        onReset={handleGameFieldReset}
        fallback={GameFieldErrorFallback}
      >
        <GameField {...gameFieldProps} />
      </ErrorBoundary>

      <ErrorBoundary
        componentName="GameControls"
        onError={handleControlsError}
      >
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