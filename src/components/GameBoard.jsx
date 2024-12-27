import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import '../styles/GameElements.css'
import Paddle from './Paddle'
import Ball from './Ball'
import MultiplayerMenu from './MultiplayerMenu'
import { useMultiplayer } from '../hooks/useMultiplayer'
import ConnectionError from './ConnectionError'
import NetworkStatus from './NetworkStatus'
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
  BALL_SPEED
} from '../constants/gameConstants';

// Group all constants at the top
const PADDLE_BOUNDARIES = {
  top: 0,
  bottom: BOARD_HEIGHT - PADDLE_HEIGHT
};

function GameBoard() {
  // Move these state declarations to the top with other state
  const [isLoading, setIsLoading] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    latency: 0,
    quality: 'good'
  });
  const [connectionError, setConnectionError] = useState(null);

  // Group ALL refs together at the top
  const frameIdRef = useRef(null);
  const ballBufferRef = useRef([]);
  const scoreProcessedRef = useRef(false);
  const countdownIntervalRef = useRef(null);

  // State for paddle positions
  const [leftPaddlePos, setLeftPaddlePos] = useState(250)
  const [rightPaddlePos, setRightPaddlePos] = useState(250)
  
  // State to track which keys are currently pressed
  const [keysPressed, setKeysPressed] = useState(new Set());
  
  // Add ball state
  const [ballPos, setBallPos] = useState({
    x: 400, // Center of board (800/2)
    y: 300  // Center of board (600/2)
  })

  // Add score state
  const [score, setScore] = useState({
    left: 0,
    right: 0
  })

  // Update initial ball velocity state
  const [ballVelocity, setBallVelocity] = useState({
    x: BALL_SPEED.x,
    y: BALL_SPEED.y
  })

  // Add game state
  const [isGameStarted, setIsGameStarted] = useState(false)

  // Add state for scoring delay
  const [isScoreDelay, setIsScoreDelay] = useState(false)

  // Add winning state
  const [winner, setWinner] = useState(null)

  // Add player names state
  const [playerNames, setPlayerNames] = useState({
    left: 'Player 1',
    right: 'Player 2'
  })

  // Add pause state
  const [isPaused, setIsPaused] = useState(false)

  // Add countdown state
  const [countdown, setCountdown] = useState(null)

  // Add multiplayer state
  const [isMultiplayer, setIsMultiplayer] = useState(false)
  const { 
    socket, 
    roomId, 
    error: socketError, 
    isReady, 
    createRoom, 
    joinRoom,
    role,
    sendPaddleMove,
    sendBallMove,
    sendScore,
    playersReady,
    toggleReady,
    isReconnecting,
    disconnect,
    clearSession,
    sendWinner,
    serverTimeOffset,
    networkStats: currentNetworkStats,
    isConnected,
    paddleBuffer,
    isCreatingRoom,
    isJoiningRoom
  } = useMultiplayer({
    setBallPos,
    setBallVelocity,
    setLeftPaddlePos,
    setRightPaddlePos,
    setScore,
    onPauseUpdate: setIsPaused,
    onCountdownUpdate: setCountdown,
    onGameStart: () => setIsGameStarted(true),
    onGameEnd: () => setIsGameStarted(false),
    onWinnerUpdate: setWinner,
    onLoadingChange: setIsLoading,
    onNetworkStatsUpdate: setNetworkStats
  });

  // Add connection error handler
  useEffect(() => {
    if (socketError) {
      setConnectionError(socketError);
    }
  }, [socketError]);

  // Add retry handler
  const handleRetryConnection = () => {
    setConnectionError(null);
    if (roomId) {
      // Attempt to rejoin the room
      joinRoom(roomId);
    }
  };

  // Add exit handler
  const handleExitMultiplayer = () => {
    setConnectionError(null);
    setIsMultiplayer(false);
    disconnect();
  };

  // 1. Basic utility functions that don't depend on other functions
  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(null)
  }

  const handleNameChange = (player, value) => {
    const trimmedValue = value.trim()
    setPlayerNames(prev => ({
      ...prev,
      [player]: trimmedValue === '' ? `Player ${player === 'left' ? '1' : '2'}` : value
    }))
  }

  // 2. Collision detection (used by updateBallPhysics)
  const checkCollision = useCallback((ballPos, paddlePos, isLeftPaddle) => {
    const paddleX = isLeftPaddle ? PADDLE_OFFSET : BOARD_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH;
    return (
      ballPos.x < paddleX + PADDLE_WIDTH &&
      ballPos.x + BALL_SIZE > paddleX &&
      ballPos.y < paddlePos + PADDLE_HEIGHT &&
      ballPos.y + BALL_SIZE > paddlePos
    );
  }, []);

  // 3. Ball reset (used by handleScoring)
  const resetBallWithDelay = (direction) => {
    setIsScoreDelay(true)
    const totalScore = score.left + score.right;
    const goalSpeedIncrease = Math.min(totalScore * 0.15, 0.5);
    const currentSpeed = BALL_SPEED.x * (1 + goalSpeedIncrease);
    
    setTimeout(() => {
      setBallPos({
        x: BOARD_WIDTH / 2,
        y: BOARD_HEIGHT / 2
      })
      setBallVelocity({
        x: direction * currentSpeed,
        y: Math.random() * BALL_SPEED.y * 2 - BALL_SPEED.y
      })
      setIsScoreDelay(false)
    }, 1000)
  }

  // 4. Scoring handler (used by updateBallPhysics)
  const handleScoring = useCallback((scorer) => {
    if (scoreProcessedRef.current) return;
    scoreProcessedRef.current = true;
    
    setScore(prev => ({
      ...prev,
      [scorer]: prev[scorer] + 1
    }));

    const newScore = {
      ...score,
      [scorer]: score[scorer] + 1
    };

    if (newScore[scorer] >= WINNING_SCORE) {
      setWinner(playerNames[scorer]);
      setIsGameStarted(false);
      if (isMultiplayer) {
        sendWinner(playerNames[scorer]);
      }
      return;
    }

    resetBallWithDelay(scorer === 'left' ? 1 : -1);
    
    if (isMultiplayer) {
      sendScore(newScore, scorer);
    }

    setTimeout(() => {
      scoreProcessedRef.current = false;
    }, 1000);
  }, [score, playerNames, isMultiplayer, sendScore, sendWinner]);

  // 5. Ball interpolation (used in game loop)
  const interpolateBall = useCallback((timestamp) => {
    const buffer = ballBufferRef.current;
    if (buffer.length < 2) return;

    const currentTime = timestamp + serverTimeOffset;
    const [prev, next] = buffer;
    
    const progress = (currentTime - prev.timestamp) / 
                    (next.timestamp - prev.timestamp);
    
    if (progress <= 1) {
      setBallPos({
        x: prev.pos.x + (next.pos.x - prev.pos.x) * progress,
        y: prev.pos.y + (next.pos.y - prev.pos.y) * progress
      });
    }

    while (buffer.length > 2 && buffer[0].timestamp < currentTime - 100) {
      buffer.shift();
    }
  }, [serverTimeOffset]);

  // 6. Ball physics (uses handleScoring and checkCollision)
  const updateBallPhysics = useCallback((deltaTime) => {
      const newBallPos = {
        x: ballPos.x + ballVelocity.x,
        y: ballPos.y + ballVelocity.y
      };

      if (newBallPos.x <= 0 || newBallPos.x >= BOARD_WIDTH) {
      handleScoring(newBallPos.x <= 0 ? 'right' : 'left');
        return;
      }

      if (newBallPos.y <= 0 || newBallPos.y >= BOARD_HEIGHT - BALL_SIZE) {
        setBallVelocity(prev => ({ ...prev, y: -prev.y }));
      return;
      }

      if (checkCollision(newBallPos, leftPaddlePos, true) || 
          checkCollision(newBallPos, rightPaddlePos, false)) {
        setBallVelocity(prev => ({ ...prev, x: -prev.x }));
      return;
      }

      setBallPos(newBallPos);
      sendBallMove(newBallPos, ballVelocity);
  }, [ballPos, ballVelocity, leftPaddlePos, rightPaddlePos, sendBallMove, handleScoring, checkCollision]);

  // 7. Paddle movement and interpolation functions
  const updateLocalPaddle = useCallback((deltaTime, side, [upKey, downKey]) => {
    if (!keysPressed.has(upKey) && !keysPressed.has(downKey)) return;

    const moveAmount = (PADDLE_SPEED * deltaTime) / PHYSICS_STEP;
    const isMovingDown = keysPressed.has(downKey);
    const currentPos = side === 'left' ? leftPaddlePos : rightPaddlePos;
    const setPosition = side === 'left' ? setLeftPaddlePos : setRightPaddlePos;

    // Calculate new position
    let newPosition = currentPos + (isMovingDown ? moveAmount : -moveAmount);
    
    // Clamp position to boundaries
    newPosition = Math.max(0, Math.min(BOARD_HEIGHT - PADDLE_HEIGHT, newPosition));

    // Only update if position has changed significantly
    if (Math.abs(newPosition - currentPos) > 0.5) {
      setPosition(newPosition);
      sendPaddleMove(newPosition, side);
    }
  }, [keysPressed, leftPaddlePos, rightPaddlePos, sendPaddleMove]);

  const interpolateOpponentPaddle = useCallback((timestamp) => {
    const side = role === 'host' ? 'right' : 'left';
    const buffer = paddleBuffer[side];
    
    if (buffer.length < 2) return;

    const [prev, next] = buffer.slice(-2);  // Get the last two positions
    const currentTime = performance.now();
    
    if (!prev?.timestamp || !next?.timestamp) return;
    
    // Ensure timestamps are in correct order
    if (prev.timestamp >= next.timestamp) return;
    
    const timeDiff = next.timestamp - prev.timestamp;
    const progress = Math.min(1, Math.max(0, 
      (currentTime - prev.timestamp) / timeDiff
    ));

    // Only interpolate if we haven't reached the target
    if (progress < 1) {
      const interpolatedPosition = Math.max(
        0,
        Math.min(
          BOARD_HEIGHT - PADDLE_HEIGHT,
          prev.position + (next.position - prev.position) * progress
        )
      );

      if (side === 'left') {
        setLeftPaddlePos(interpolatedPosition);
      } else {
        setRightPaddlePos(interpolatedPosition);
      }
    } else {
      // If we've reached the target, just set to the final position
      if (side === 'left') {
        setLeftPaddlePos(next.position);
      } else {
        setRightPaddlePos(next.position);
      }
    }

    // Clean up old positions
    if (buffer.length > 2 && currentTime - buffer[0].timestamp > 1000) {
      buffer.shift();
    }
  }, [role, paddleBuffer]);

  // 8. Pause/resume handlers
  const handlePauseChange = useCallback((shouldPause) => {
    if (!isGameStarted || !roomId) return;
    
    if (shouldPause) {
      setIsPaused(true);
      socket?.emit('pauseGame', { roomId, isPaused: true });
    } else {
      // Start countdown
      let count = 3;
      setCountdown(count);

      const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdown(count);
          socket?.emit('countdown', { roomId, count });
        } else {
          clearInterval(countdownInterval);
    setCountdown(null);
          setIsPaused(false);
          socket?.emit('pauseGame', { roomId, isPaused: false });
        }
      }, 1000);

      countdownIntervalRef.current = countdownInterval;
    }
  }, [isGameStarted, roomId, socket]);

  const handlePause = useCallback(() => {
    if (!isMultiplayer || role !== 'host') return;

    const newPausedState = !isPaused;
    setIsPaused(newPausedState);
    
    socket?.emit('pauseGame', {
      isPaused: newPausedState,
      countdownValue: newPausedState ? null : 3
    });
  }, [isMultiplayer, role, isPaused, socket]);

  const handleResume = useCallback(() => {
    if (role === 'host') {
      setIsPaused(false);
      socket?.emit('pauseGame', {
        isPaused: false,
        countdownValue: 3
      });
    }
  }, [role, socket]);

  // Update game loop to include paddle interpolation
  useEffect(() => {
    if (!isGameStarted || !roomId || isPaused || countdown) {
      // Clean up any existing animation frame
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      return;
    }

    let lastFrameTime = performance.now();
    console.log(`Setting up game loop for ${role}`);

    const gameLoop = (timestamp) => {
      if (!isGameStarted || isPaused) {
        // Exit the loop if game is no longer active
        return;
      }

      const deltaTime = timestamp - lastFrameTime;
      
      if (deltaTime >= PHYSICS_STEP) {
        if (role === 'host') {
          // Host: Update ball physics and left paddle
          updateBallPhysics(deltaTime);
          updateLocalPaddle(deltaTime, 'left', ['w', 's']);
          interpolateOpponentPaddle(timestamp); // Interpolate right paddle
        } else {
          // Client: Interpolate ball and update right paddle
          interpolateBall(timestamp);
          updateLocalPaddle(deltaTime, 'right', ['ArrowUp', 'ArrowDown']);
          interpolateOpponentPaddle(timestamp); // Interpolate left paddle
        }

        lastFrameTime = timestamp;
      }

      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [
    isGameStarted,
    roomId,
    isPaused,
    countdown,
    role,
    updateBallPhysics,
    updateLocalPaddle,
    interpolateBall,
    interpolateOpponentPaddle
  ]);

  // Single cleanup effect for all animations and intervals
  useEffect(() => {
    return () => {
      // Clean up the single animation frame
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
      
      // Clear intervals
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Reset game state
      setIsGameStarted(false);
      setIsPaused(false);
      setCountdown(null);
      
      // Clear buffers
      ballBufferRef.current = [];
    };
  }, []);

  // Single keyboard handling effect
  useEffect(() => {
    const validKeys = new Set(['w', 's', 'ArrowUp', 'ArrowDown', 'Escape']);
    
    const handleKeyDown = (e) => {
      // Ignore if typing in an input field
      if (e.target.tagName.toLowerCase() === 'input') return;
      
      const key = e.key;
      if (!validKeys.has(key)) return;
      
      e.preventDefault();
      setKeysPressed(prev => new Set([...prev, key]));

      // Handle pause/resume with Escape
      if (key === 'Escape' && isGameStarted) {
        if (countdown) {
          clearInterval(countdownIntervalRef.current);
          setCountdown(null);
          handlePauseChange(true);
        } else {
          handlePauseChange(!isPaused);
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key;
      if (validKeys.has(key)) {
        setKeysPressed(prev => {
          const newKeys = new Set([...prev]);
          newKeys.delete(key);
          return newKeys;
        });
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isGameStarted, isPaused, countdown, handlePauseChange]);

  // 9. Render functions
  const renderReconnectingOverlay = () => {
    if (!isReconnecting) return null;
    
    return (
      <div className="reconnecting-overlay">
        <div className="reconnecting-message">
          Reconnecting...
        </div>
      </div>
    );
  };

  const handlePauseMenuClick = (e) => {
    // Prevent clicks from bubbling up
    e.stopPropagation();
  };

  const handleExit = useCallback(() => {
    if (role === 'host') {
      socket?.emit('pauseGame', {
        isPaused: false,
        countdownValue: null
      });
    }
    setIsGameStarted(false);
    setIsPaused(false);
    clearSession();
  }, [role, socket, clearSession]);

  const renderStartMenu = () => {
    if (winner) {
      return (
        <div className="winner-screen">
          <h2>{winner} Wins!</h2>
          <button 
            className="start-button"
            onClick={() => {
              setWinner(null);
              setScore({ left: 0, right: 0 });
            }}
          >
            Play Again
          </button>
        </div>
      );
    }

    // If not in multiplayer mode, show the initial menu
    if (!isMultiplayer) {
      return (
        <div className="menu-container">
          <h1>Pong Game</h1>
          <div className="button-group">
            <button 
              className="start-button"
              onClick={() => setIsGameStarted(true)}
            >
              Single Player
            </button>
            <button 
              className="multiplayer-button"
              onClick={() => {
                clearSession(); // Clear any existing session first
                setIsMultiplayer(true);
              }}
            >
              Multiplayer
            </button>
          </div>
        </div>
      );
    }

    return (
      <MultiplayerMenu
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onToggleReady={toggleReady}
        roomId={roomId}
        error={socketError}
        playersReady={playersReady}
        role={role}
        mySocketId={socket?.id}
        isReconnecting={isReconnecting}
        isCreatingRoom={isCreatingRoom}
        isJoiningRoom={isJoiningRoom}
        onBack={() => {
          console.log('Back button clicked');
          clearSession();  // Clear session first
          disconnect();    // Then disconnect
          setIsMultiplayer(false);  // Finally, exit multiplayer mode
        }}
      />
    );
  };

  const updateGameState = useCallback((timestamp) => {
    if (!isGameStarted || isPaused) return;

    // Update ball position (only if host)
    if (role === 'host') {
      const newBallPos = {
        x: ballPos.x + ballVelocity.x,
        y: ballPos.y + ballVelocity.y
      };

      // Ball collision logic...
      
      setBallPos(newBallPos);
      sendBallMove(newBallPos, ballVelocity);
    }

    // Update paddle positions
    if (keysPressed.has('w') || keysPressed.has('ArrowUp')) {
      const newPos = Math.max(0, (role === 'host' ? leftPaddlePos : rightPaddlePos) - PADDLE_SPEED);
      if (role === 'host') {
        setLeftPaddlePos(newPos);
        sendPaddleMove(newPos, 'left');
      } else {
        setRightPaddlePos(newPos);
        sendPaddleMove(newPos, 'right');
      }
    }
    // ... similar for other paddle movements
  }, [isGameStarted, isPaused, ballPos, ballVelocity, role, sendBallMove, keysPressed, leftPaddlePos, rightPaddlePos, sendPaddleMove]);

  // Add keydown handler for pause
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'p') {
        handlePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePause]);

  return (
    <div className="game-container">
      {connectionError && (
        <ConnectionError 
          error={connectionError}
          onRetry={handleRetryConnection}
          onExit={handleExitMultiplayer}
        />
      )}
      {isMultiplayer && isGameStarted && (
        <NetworkStatus 
          latency={networkStats.latency}
          quality={networkStats.quality}
        />
      )}
      {isGameStarted ? (
        <>
          <div className="score-board">
            <div className="player-score">
              <div className="player-name">{playerNames.left}</div>
              <div className="score">{score.left}</div>
            </div>
            <div className="player-score">
              <div className="player-name">{playerNames.right}</div>
              <div className="score">{score.right}</div>
            </div>
          </div>
          <div className="game-board">
            <Paddle position="left" top={leftPaddlePos} />
            <Paddle position="right" top={rightPaddlePos} />
            <Ball position={ballPos} />
            {(isPaused || countdown) && (
              <div className="pause-overlay">
                <div 
                  className="pause-menu"
                  onClick={handlePauseMenuClick}
                >
                  {countdown ? (
                    <div className="countdown">{countdown}</div>
                  ) : (
                    <>
                      <h2>Game Paused</h2>
                      <div className="button-group">
                        <button className="start-button" onClick={handleResume}>
                          Resume
                        </button>
                        <button className="back-button" onClick={handleExit}>
                          Exit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {renderReconnectingOverlay()}
        </>
      ) : (
        <div className="start-menu">
          {renderStartMenu()}
        </div>
      )}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}
    </div>
  )
}

export default GameBoard 