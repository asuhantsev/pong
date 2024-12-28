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
  BALL_SPEED,
  SPEED_INCREASE
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
    x: BALL_SPEED.initial.x,
    y: BALL_SPEED.initial.y
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

  // Add rematch state
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchAccepted, setRematchAccepted] = useState(false);

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
    onWinnerUpdate: (winner) => {
      console.log('Winner update received:', winner);
      setWinner(winner);
      setIsGameStarted(false);
    },
    onLoadingChange: setIsLoading,
    onNetworkStatsUpdate: setNetworkStats,
    setWinner,
    setIsGameStarted
  });

  // Add connection error handler
  useEffect(() => {
    if (socketError) {
      setConnectionError(socketError);
      // Try to reconnect after a delay
      if (isMultiplayer) {
        const timer = setTimeout(() => {
          if (socket) {
            console.log('Attempting to reconnect...');
            socket.connect();
          }
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [socketError, socket, isMultiplayer]);

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
    setIsScoreDelay(true);
    const totalScore = score.left + score.right;
    
    // Calculate new speed with 1.5 increase per goal, capped at max speed
    const newSpeed = Math.min(
      BALL_SPEED.initial.x + (totalScore * SPEED_INCREASE),
      BALL_SPEED.max
    );
    
    setTimeout(() => {
      setBallPos({
        x: BOARD_WIDTH / 2,
        y: BOARD_HEIGHT / 2
      });
      setBallVelocity({
        x: direction * newSpeed,
        y: (Math.random() * 2 - 1) * newSpeed // Randomize y direction with same speed
      });
      setIsScoreDelay(false);
    }, 1000);
  };

  // 4. Scoring handler (used by updateBallPhysics)
  const handleScoring = useCallback((scorer) => {
    if (scoreProcessedRef.current) return;
    scoreProcessedRef.current = true;
    
    const newScore = {
      ...score,
      [scorer]: score[scorer] + 1
    };
    
    setScore(newScore);

    if (newScore[scorer] >= WINNING_SCORE) {
      const winnerName = playerNames[scorer];
      console.log('Game won by:', winnerName, 'Score:', newScore);
      
      setWinner(winnerName);
      setIsGameStarted(false);
      
      if (isMultiplayer && socket?.connected) {
        socket.emit('gameWinner', {
          winner: winnerName,
          roomId,
          score: newScore
        });
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
  }, [score, playerNames, isMultiplayer, socket, roomId, sendScore]);

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
    if (!isGameStarted) return;
    
    const newPauseState = !isPaused;
    
    if (isMultiplayer && socket?.connected) {
      console.log('Sending pause update:', { newPauseState });
      try {
        socket.emit('pauseGame', {
          isPaused: newPauseState,
          countdownValue: newPauseState ? null : 3
        });
      } catch (error) {
        console.error('Error sending pause update:', error);
      }
    }
    // Always update local state
    setIsPaused(newPauseState);
  }, [isGameStarted, isPaused, socket, isMultiplayer]);

  const handleResume = useCallback(() => {
    if (!socket?.connected) return;
    
    // Start countdown
    let count = 3;
    
    // Send initial countdown state
    socket.emit('pauseGame', {
      isPaused: true,
      countdownValue: count
    });
    
    const countdownInterval = setInterval(() => {
      count--;
      
      if (count > 0) {
        socket.emit('pauseGame', {
          isPaused: true,
          countdownValue: count
        });
      } else {
        clearInterval(countdownInterval);
        socket.emit('pauseGame', {
          isPaused: false,
          countdownValue: null
        });
      }
    }, 1000);

    // Store interval reference for cleanup
    countdownIntervalRef.current = countdownInterval;
  }, [socket]);

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
    e.stopPropagation();
  };

  const handleExit = useCallback(() => {
    if (socket?.connected) {
      socket.emit('playerExit', { roomId });
    }
    
    // Reset all game states
    setWinner(null);
    setScore({ left: 0, right: 0 });
    setIsGameStarted(false);
    setIsMultiplayer(false);
    setRematchRequested(false);
    setRematchAccepted(false);
    setIsReady(false); // Ensure player is unready
    
    // Reset ball position and velocity
    setBallPos({
      x: BOARD_WIDTH / 2,
      y: BOARD_HEIGHT / 2
    });
    setBallVelocity({
      x: BALL_SPEED.initial.x,
      y: BALL_SPEED.initial.y
    });
    
    disconnect();
    clearSession();
  }, [socket, roomId, disconnect, clearSession]);

  // Add exit notification handler
  useEffect(() => {
    if (!socket) return;
    
    const handlePlayerExit = () => {
      setIsGameStarted(false);
      setIsPaused(false);
      setConnectionError('Other player has left the game');
      
      // Auto-cleanup after showing message
      setTimeout(() => {
        setConnectionError(null);
        setIsMultiplayer(false);
        clearSession();
      }, 3000);
    };
    
    socket.on('playerExited', handlePlayerExit);
    return () => socket.off('playerExited', handlePlayerExit);
  }, [socket, clearSession]);

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

      // Ball collision with top and bottom
      if (newBallPos.y <= 0 || newBallPos.y >= BOARD_HEIGHT - BALL_SIZE) {
        setBallVelocity(prev => ({
          ...prev,
          y: -prev.y
        }));
        newBallPos.y = newBallPos.y <= 0 ? 0 : BOARD_HEIGHT - BALL_SIZE;
      }

      // Send ball update before setting state
      sendBallMove(newBallPos, ballVelocity);
      
      // Update local state after sending
      setBallPos(newBallPos);
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

  // Update the pause menu render
  const renderPauseMenu = () => {
    if (!isPaused) return null;
    
    return (
      <div className="pause-overlay" onClick={handlePauseMenuClick}>
        <div className="pause-menu">
          <h2>Game Paused</h2>
          <button onClick={handlePause}>Resume</button>
          <button onClick={handleExit}>Exit</button>
        </div>
      </div>
    );
  };

  // Add pause button UI
  const renderPauseButton = () => {
    if (!isGameStarted) return null;

    return (
      <button 
        className="pause-button"
        onClick={handlePause}
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    );
  };

  // Update countdown display
  const renderCountdown = () => {
    if (!countdown) return null;
    
    return (
      <div className="pause-overlay">
        <div className="countdown">
          {countdown}
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log('GameBoard state:', {
      isGameStarted,
      winner,
      isPaused,
      isMultiplayer,
      role
    });
  }, [isGameStarted, winner, isPaused, isMultiplayer, role]);

  // Add reconnection handler
  useEffect(() => {
    if (socket && !socket.connected && isGameStarted) {
      console.log('Attempting to reconnect socket...');
      socket.connect();
    }
  }, [socket, isGameStarted]);

  // Add pause event handler
  useEffect(() => {
    if (!socket) return;
    
    const handlePauseUpdate = (data) => {
      console.log('Received pause update:', data);
      
      // Clear any existing countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      setIsPaused(data.isPaused);
      
      if (data.countdownValue) {
        let count = data.countdownValue;
        setCountdown(count);
        
        countdownIntervalRef.current = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdown(count);
          } else {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            setCountdown(null);
            setIsPaused(false);
          }
        }, 1000);
      }
    };
    
    socket.on('pauseUpdate', handlePauseUpdate);
    return () => {
      socket.off('pauseUpdate', handlePauseUpdate);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [socket]);

  // Update winner screen render
  const renderWinnerScreen = () => {
    if (!winner) return null;
    const isWinner = winner === (role === 'host' ? playerNames.left : playerNames.right);
    
    return (
      <div className="pause-overlay">
        <div className="winner-screen">
          <h2>{isWinner ? 'You Won!' : 'You Lost!'}</h2>
          <div className="winner-message">
            {isWinner ? 'Congratulations!' : `${winner} won the game!`}
          </div>
          <div className="winner-buttons">
            <button 
              className="rematch-button"
              onClick={handleRematchRequest}
              disabled={rematchRequested}
            >
              {rematchRequested ? 'Waiting...' : 'Play Again'}
            </button>
            <button 
              className="exit-button"
              onClick={handleExit}
            >
              Exit to Menu
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add rematch handlers
  const handleRematchRequest = useCallback(() => {
    if (!socket?.connected) return;
    
    setRematchRequested(true);
    setIsReady(false); // Ensure players start unready
    socket.emit('rematchRequest', { roomId });
  }, [socket, roomId]);

  // Add rematch effect handler
  useEffect(() => {
    if (!socket) return;
    
    const handleRematchRequest = () => {
      setConnectionError(`Opponent wants a rematch!`);
    };
    
    const handleRematchAccepted = () => {
      console.log('Rematch accepted, resetting game state');
      setRematchAccepted(true);
      setRematchRequested(false);
      setWinner(null);
      setScore({ left: 0, right: 0 });
      setConnectionError(null);
      setIsGameStarted(true);
      
      // Reset game state for rematch with initial speed
      setBallPos({
        x: BOARD_WIDTH / 2,
        y: BOARD_HEIGHT / 2
      });
      setBallVelocity({
        x: BALL_SPEED.initial.x,
        y: BALL_SPEED.initial.y
      });
    };
    
    const handleRematchDeclined = () => {
      setRematchRequested(false);
      setConnectionError('Opponent declined rematch');
      setTimeout(() => setConnectionError(null), 3000);
    };
    
    socket.on('rematchRequest', handleRematchRequest);
    socket.on('rematchAccepted', handleRematchAccepted);
    socket.on('rematchDeclined', handleRematchDeclined);
    
    return () => {
      socket.off('rematchRequest', handleRematchRequest);
      socket.off('rematchAccepted', handleRematchAccepted);
      socket.off('rematchDeclined', handleRematchDeclined);
    };
  }, [socket, setBallPos, setBallVelocity]);

  return (
    <div className="game-container">
      {renderPauseButton()}
      {renderPauseMenu()}
      {renderCountdown()}
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
          <div className="game-board-wrapper" style={{ 
            position: 'relative',
            background: '#333333'
          }}>
          <div className="game-board">
            <Paddle position="left" top={leftPaddlePos} />
            <Paddle position="right" top={rightPaddlePos} />
            <Ball position={ballPos} />
                      </div>
                </div>
        </>
      ) : (
        <div className="start-menu">
          {renderStartMenu()}
        </div>
      )}
    </div>
  )
}

export default GameBoard 