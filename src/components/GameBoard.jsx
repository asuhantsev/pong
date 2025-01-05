import { useState, useEffect, useRef, useCallback } from 'react'
import styles from '../styles/components/GameBoard.module.css'
import containerStyles from '../styles/components/shared/Container.module.css'
import cardStyles from '../styles/components/shared/Card.module.css'
import typographyStyles from '../styles/components/shared/Typography.module.css'
import errorStyles from '../styles/components/shared/ErrorMessage.module.css'
import animationStyles from '../styles/components/shared/Animations.module.css'
import buttonStyles from '../styles/components/shared/Button.module.css'
import gameAnimations from '../styles/components/game/animations.module.css'
import gridStyles from '../styles/components/shared/Grid.module.css'

// Core components first
import Ball from './Ball'
import Paddle from './Paddle'

// Menu components
import { MainMenu } from './menu/MainMenu'
import { OptionsMenu } from './menu/OptionsMenu'
import { MultiplayerMenu } from './menu/MultiplayerMenu'

// Utility components
import { ConnectionError } from './ConnectionError'
import { NetworkStatus } from './game/ui/NetworkStatus'

// Hooks and utils
import { useGame } from '../hooks/useGame.jsx'
import { usePlayer } from '../hooks/usePlayer'
import { useRoom } from '../hooks/useRoom'
import { usePhysics } from '../hooks/usePhysics'
import { useError } from '../hooks/useError'
import { useNetworking } from '../hooks/useNetworking'

// Constants last
import { 
  PADDLE_SPEED,
  BALL_SIZE,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_OFFSET,
  WINNING_SCORE,
  PHYSICS_STEP,
  INTERPOLATION_STEP,
  BALL_SPEED,
  SPEED_INCREASE,
  NICKNAME_RULES
} from '../constants/gameConstants'

// Group all constants at the top
const PADDLE_BOUNDARIES = {
  top: 0,
  bottom: BOARD_HEIGHT - PADDLE_HEIGHT
};

// Add imports at the top
import { PauseOverlay } from './game/ui/overlays/PauseOverlay';
import { CountdownOverlay } from './game/ui/overlays/CountdownOverlay';
import { ScoreBoard } from './game/ui/ScoreBoard';
import { GameControls } from './game/controls/GameControls';
import { MultiplayerGame } from './game/multiplayer/MultiplayerGame';

export function GameBoard() {
  const { state: gameState, actions: gameActions } = useGame();
  const { 
    nickname, 
    isReady, 
    role, 
    paddlePosition,
    updatePaddlePosition 
  } = usePlayer();
  const {
    roomId,
    playersReady,
    playerNicknames,
    isReconnecting,
    createRoom,
    joinRoom
  } = useRoom();
  const { physics, updatePhysics, resetBall } = usePhysics();
  const { errors, setError } = useError();
  const { 
    isConnected, 
    socket, 
    currentRoom,
    actions: networkActions 
  } = useNetworking();

  // Add loading state
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [gameMode, setGameMode] = useState(null);

  // Add debug logging
  useEffect(() => {
    console.log('Game State:', gameState);
    console.log('Game Mode:', gameMode);
    console.log('Physics State:', physics);
  }, [gameState, gameMode, physics]);

  // Add state validation
  if (!gameState) {
    console.error('Game state is undefined');
    return (
      <div className={`${containerStyles.container} ${containerStyles.game}`}>
        <div className={`${cardStyles.card} ${errorStyles.error}`}>
          <h2 className={typographyStyles.h2}>Error</h2>
          <p>Failed to initialize game state</p>
          <button 
            className={buttonStyles.button}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Modify initialization effect
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true);
        setInitError(null);

        // Different initialization based on game mode
        if (gameMode === 'multiplayer' && (!socket || !isConnected)) {
          return; // Only wait for connection in multiplayer mode
        }

        // Initialize game state
        await gameActions.initialize(gameMode);
        
        // Start game immediately for single player
        if (gameMode === 'single') {
          await gameActions.startGame();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Game initialization failed:', error);
        setInitError('Failed to initialize game. Please try refreshing the page.');
        setIsLoading(false);
      }
    };

    if (gameMode) {
      console.log('Initializing game with mode:', gameMode);
      initializeGame();
    }
  }, [gameMode, socket, isConnected, gameActions]);

  // Handle socket errors
  useEffect(() => {
    if (socketError && gameMode === 'multiplayer') {
      setError('socket', socketError);
    }
  }, [socketError, gameMode, setError]);

  // Modify the game mode selection to initialize game state
  const handleModeSelect = (mode) => {
    setGameMode(mode);
    gameActions.setMode(mode);
  };

  // Update mode selection render
  if (!gameMode) {
    return (
      <div className={`${containerStyles.container} ${containerStyles.game}`}>
        <div className={`${cardStyles.card}`}>
          <h2 className={typographyStyles.h2}>Select Game Mode</h2>
          <div className={`${gridStyles.grid} ${gridStyles.gap2}`}>
            <button 
              className={buttonStyles.button}
              onClick={() => handleModeSelect('single')}
            >
              Single Player
            </button>
            <button 
              className={buttonStyles.button}
              onClick={() => handleModeSelect('multiplayer')}
            >
              Multiplayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game loop using physics context
  useEffect(() => {
    let frameId;
    const gameLoop = (timestamp) => {
      updatePhysics(timestamp);
      frameId = requestAnimationFrame(gameLoop);
    };

    if (gameState.isGameStarted && !gameState.isPaused) {
      frameId = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [gameState.isGameStarted, gameState.isPaused, updatePhysics]);

  // Handle pause
  const handlePause = useCallback(() => {
    if (!isConnected || !roomId) return;
    
    gameActions.togglePause(3); // Start 3 second countdown
  }, [isConnected, roomId, gameActions]);

  // Handle game reset
  const handleReset = useCallback(() => {
    resetBall();
    gameActions.startGame();
  }, [resetBall, gameActions]);

  // Add loading state check in render
  if (isLoading) {
    return (
      <div className={`${containerStyles.container} ${containerStyles.game}`}>
        <div className={`${cardStyles.card} ${animationStyles.pulse}`}>
          <h2 className={typographyStyles.h2}>Loading Game...</h2>
          <NetworkStatus />
        </div>
      </div>
    );
  }

  // Add error state check in render
  if (initError) {
    return (
      <div className={`${containerStyles.container} ${containerStyles.game}`}>
        <div className={`${cardStyles.card} ${errorStyles.error}`}>
          <h2 className={typographyStyles.h2}>Error</h2>
          <p>{initError}</p>
          <button 
            className={buttonStyles.button}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerStyles.container} ${containerStyles.game} ${animationStyles.fadeIn}`}>
      {(gameState.isGameStarted || gameMode === 'single') ? (
        <>
          <div className={styles.gameField}>
            <div className={styles.centerLine} />
            <Ball 
              position={physics.ballPosition} 
              className={gameAnimations.bounce}
            />
            <Paddle 
              position="left" 
              top={gameMode === 'single' ? paddlePosition : (role === 'left' ? paddlePosition : physics.leftPaddlePos)}
              className={gameAnimations.slide}
            />
            <Paddle 
              position="right" 
              top={gameMode === 'single' ? physics.rightPaddlePos : (role === 'right' ? paddlePosition : physics.rightPaddlePos)}
              className={gameAnimations.slide}
            />
          </div>
          <div className={`${styles.controls} ${gridStyles.grid} ${gridStyles.gap3}`}>
            <GameControls 
              onPause={handlePause}
              disabled={!!gameState.winner}
              isPaused={gameState.isPaused}
            />
          </div>
          <div className={styles.score}>
            <ScoreBoard 
              score={gameState.score}
              playerNames={gameState.playerNames}
            />
          </div>
          {gameState.isPaused && <PauseOverlay onResume={handlePause} />}
          {gameState.countdown && <CountdownOverlay count={gameState.countdown} />}
        </>
      ) : (
        <MultiplayerGame
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          roomId={roomId}
          playersReady={playersReady}
          playerNicknames={playerNicknames}
          isReconnecting={isReconnecting}
          nickname={nickname}
          isReady={isReady}
          role={role}
          error={errors.room}
          onReset={handleReset}
        />
      )}
      {errors.socket && (
        <ConnectionError 
          error={errors.socket}
          onRetry={() => socket.connect()}
          onRecovery={handleServerChange}
        />
      )}
      <NetworkStatus />
    </div>
  );
}

export default GameBoard 