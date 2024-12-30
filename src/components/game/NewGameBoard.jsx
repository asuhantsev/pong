import { useCallback, useEffect, useState } from 'react';
import { useStore, useDispatch, useSelector } from '../../store/store.jsx';
import { gameActions, physicsActions } from '../../store/actions.jsx';
import { useNewPhysics } from '../../hooks/useNewPhysics.jsx';
import { useNewGameLoop } from '../../hooks/useNewGameLoop.jsx';
import { GameField } from './GameField';
import { GameControls } from './controls/GameControls';
import { PauseOverlay } from './controls/PauseOverlay';
import { ScoreBoard } from './ui/ScoreBoard';
import { CountdownOverlay } from './ui/CountdownOverlay';
import styles from '../../styles/components/game/GameBoard.module.css';
import Logger from '../../utils/logger';
import performanceMonitor from '../../utils/performance';
import { featureFlags, FeatureFlags } from '../../utils/featureFlags';

export function NewGameBoard() {
  // State selectors
  const gameState = useSelector(state => state.game);
  const physicsState = useSelector(state => state.physics);
  const dispatch = useDispatch();

  // New systems
  const {
    state: physicsSystemState,
    updatePhysics,
    resetPhysics,
    handlePaddleInput,
    constants: physicsConstants
  } = useNewPhysics();

  const {
    state: gameLoopState,
    addUpdateCallback,
    addRenderCallback,
    startLoop,
    stopLoop,
    pauseLoop,
    resumeLoop
  } = useNewGameLoop();

  const [pressedKeys, setPressedKeys] = useState(new Set());

  // Define pause handler
  const handlePause = useCallback(() => {
    // Don't allow pause during countdown, after win, or when game hasn't started
    if (!gameState.isStarted || gameState.countdown || gameState.winner) return;
    
    Logger.info('GameBoard', 'Game paused/resumed');
    if (gameState.isPaused) {
      resumeLoop();
    } else {
      pauseLoop();
    }
    dispatch(gameActions.pauseGame());
  }, [gameState.isStarted, gameState.countdown, gameState.winner, gameState.isPaused, dispatch, pauseLoop, resumeLoop]);

  // Initialize game state and handle countdown
  useEffect(() => {
    if (gameState.isStarted && !gameState.winner) {
      Logger.info('GameBoard', 'Game state initialized', {
        isStarted: gameState.isStarted,
        countdown: gameState.countdown,
        mode: gameState.mode
      });
      
      if (gameState.countdown === 3) {
        Logger.info('GameBoard', 'Initial countdown, resetting physics');
        resetPhysics();
      }
      
      if (gameState.countdown) {
        const timer = setInterval(() => {
          dispatch(gameActions.updateCountdown(gameState.countdown - 1));
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [gameState.isStarted, gameState.countdown, gameState.mode, dispatch, resetPhysics]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.add(e.key.toLowerCase());
        handlePaddleInput(newKeys);
        return newKeys;
      });
    };

    const handleKeyUp = (e) => {
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(e.key.toLowerCase());
        handlePaddleInput(newKeys);
        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePaddleInput]);

  // Set up game loop callbacks
  useEffect(() => {
    // Physics update callback
    const removeUpdateCallback = addUpdateCallback((deltaTime) => {
      if (!gameState.isStarted || gameState.isPaused || gameState.countdown) return;
      updatePhysics(performance.now());
    });

    // Render callback with interpolation
    const removeRenderCallback = addRenderCallback((alpha, deltaTime) => {
      if (!gameState.isStarted || gameState.isPaused || gameState.countdown) return;
      
      // Interpolated rendering could be added here if needed
      performanceMonitor.startMeasure('render');
      // ... render logic ...
      performanceMonitor.endMeasure('render', 'game');
    });

    return () => {
      removeUpdateCallback();
      removeRenderCallback();
    };
  }, [gameState.isStarted, gameState.isPaused, gameState.countdown, addUpdateCallback, addRenderCallback, updatePhysics]);

  // Start/stop game loop based on game state
  useEffect(() => {
    if (gameState.isStarted && !gameState.winner && !gameState.countdown) {
      startLoop();
    } else {
      stopLoop();
    }

    return () => stopLoop();
  }, [gameState.isStarted, gameState.winner, gameState.countdown, startLoop, stopLoop]);

  // Only render if feature flag is enabled
  if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_GAME_LOOP)) {
    return null;
  }

  return (
    <div className={styles.gameBoard}>
      <ScoreBoard score={gameState.score} />
      <GameField
        ballPosition={physicsSystemState.ball.position}
        paddlePositions={{
          left: { y: physicsSystemState.paddles.left.y },
          right: { y: physicsSystemState.paddles.right.y }
        }}
      />
      <GameControls onPause={handlePause} />
      {gameState.isPaused && <PauseOverlay />}
      {gameState.countdown && <CountdownOverlay count={gameState.countdown} />}
    </div>
  );
} 