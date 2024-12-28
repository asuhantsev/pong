import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { BOARD_HEIGHT, PADDLE_HEIGHT } from '../constants/gameConstants';

const SOCKET_SERVER = import.meta.env.PROD 
  ? 'https://pong-322h.onrender.com'
  : 'http://localhost:3001';
const STORAGE_KEY = 'pong_session';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const SOCKET_OPTIONS = {
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: true,
  path: '/socket.io/',
  autoConnect: false,
  reconnection: true,
  withCredentials: true,
  secure: true,
  rejectUnauthorized: false
};

export function useMultiplayer({ 
  setBallPos, 
  setBallVelocity, 
  setLeftPaddlePos, 
  setRightPaddlePos,
  setScore,
  onPauseUpdate,
  onCountdownUpdate,
  onGameStart,
  onGameEnd,
  onWinnerUpdate,
  onLoadingChange,
  onNetworkStatsUpdate,
  setWinner,
  setIsGameStarted
}) {
  const [socket, setSocket] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [role, setRole] = useState(null);
  const [playersReady, setPlayersReady] = useState(new Map());
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [networkStats, setNetworkStats] = useState({
    latency: 0,
    quality: 'good'
  });
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [playerNicknames, setPlayerNicknames] = useState(new Map());

  // Keep only necessary refs
  const socketRef = useRef(null);
  const paddleBufferRef = useRef({
    left: [],
    right: []
  });

  // Use local variables for throttling
  let lastPaddleUpdate = 0;
  let lastBallUpdate = 0;

  // Move socket initialization to a separate effect
  useEffect(() => {
    if (socketRef.current) {
      console.log('Socket already exists, skipping initialization');
      return;
    }

    console.log('Initializing socket connection to:', SOCKET_SERVER);
    
    const newSocket = io(SOCKET_SERVER, SOCKET_OPTIONS);
    
    // Try to connect after setup with longer delay
    const connectTimeout = setTimeout(() => {
      console.log('Attempting initial socket connection...');
      newSocket.connect();
    }, 1500); // Increased delay further

    newSocket.on('connect', () => {
      console.log('Socket connected successfully:', {
        id: newSocket.id,
        connected: newSocket.connected,
        transport: newSocket.io.engine.transport.name
      });
      setError(null);
      setRetryCount(0);
      setIsSocketReady(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', {
        error,
        transport: newSocket.io.engine?.transport?.name
      });
      setIsSocketReady(false);
    });

    setSocket(newSocket);
    socketRef.current = newSocket;

    return () => {
      clearTimeout(connectTimeout);
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsSocketReady(false);
      }
    };
  }, []);

  // Load session from storage
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      const { roomId, sessionId } = JSON.parse(savedSession);
      setRoomId(roomId);
      setSessionId(sessionId);
      setIsReconnecting(true);
    }
  }, []);

  const clearSession = useCallback(() => {
    console.log('Clearing session...');
    localStorage.removeItem(STORAGE_KEY);
    setRoomId(null);
    setSessionId(null);
    setRole(null);
    setIsReconnecting(false);
    setPlayersReady(new Map());
    // Add these to ensure complete cleanup
    setIsCreatingRoom(false);
    setIsJoiningRoom(false);
    setError(null);
  }, []);

  const saveSession = (roomId, sessionId) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ roomId, sessionId }));
  };

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    clearSession();
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, [clearSession]);

  // Use useCallback for room actions
  const createRoom = useCallback(() => {
    console.log('Creating room...', {
      socketConnected: socketRef.current?.connected,
      socketId: socketRef.current?.id,
      isSocketReady
    });

    if (!isSocketReady) {
      console.error('Cannot create room: Socket not ready');
      setError('Connecting to server...');
      return;
    }

    setIsCreatingRoom(true);
    setError(null);
    
    console.log('Emitting createRoom event');
    socketRef.current.emit('createRoom');

    // Add timeout for room creation
    const timeout = setTimeout(() => {
      if (isCreatingRoom) {
        console.error('Room creation timed out');
        setError('Room creation timed out');
        setIsCreatingRoom(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isSocketReady]);

  const joinRoom = useCallback((roomId) => {
    console.log('Attempting to join room:', roomId);
    if (!socketRef.current?.connected) {
      console.error('Cannot join room: Socket not connected');
      setError('Not connected to server');
      setIsJoiningRoom(false);
      return;
    }
    if (!roomId) {
      setError('Room code is required');
      setIsJoiningRoom(false);
      return;
    }
    setIsJoiningRoom(true);
    setError(null);
    console.log('Emitting joinRoom event:', roomId);
    socketRef.current.emit('joinRoom', roomId);

    // Add timeout for join attempt
    const timeout = setTimeout(() => {
      if (isJoiningRoom) {
        console.error('Room join timed out');
        setError('Room join timed out');
        setIsJoiningRoom(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isJoiningRoom]);

  // Add throttling for paddle updates
  const THROTTLE_MS = 16; // roughly 60fps
  
  // Throttled paddle movement sender
  const sendPaddleMove = useCallback((position, paddleSide) => {
    if (!socketRef.current?.connected || !roomId) {
      return;
    }

    const now = Date.now();
    if (now - lastPaddleUpdate >= THROTTLE_MS) {
      console.log('Sending paddle update:', { position, paddleSide });
      socketRef.current.emit('paddleMove', {
        position,
        paddleSide,
        timestamp: now
      });
      lastPaddleUpdate = now;
    }
  }, [socketRef, roomId]);

  // Ball movement sender (using the same lastBallUpdate variable)
  const sendBallMove = useCallback((position, velocity) => {
    if (!socketRef.current?.connected || !roomId || role !== 'host') {
      return;
    }
    
    const now = Date.now();
    if (now - lastBallUpdate >= THROTTLE_MS) {
      console.log('Host sending ball update:', { position, velocity });
      socketRef.current.emit('ballMove', { 
        position, 
        velocity,
        timestamp: now
      });
      socketRef.current.emit('ballSpeedSync', { velocity });
      lastBallUpdate = now;
    }
  }, [socketRef, roomId, role]);

  // Update score handling to prevent double counting
  const sendScore = (score, scorer) => {
    if (role !== 'host') return; // Only host can update score
    socket?.emit('score', { roomId, score, scorer });
  };

  const toggleReady = useCallback((roomId) => {
    console.log('Toggling ready state:', {
      roomId,
      socketId: socket?.id,
      currentReadyState: playersReady.get(socket?.id)
    });

    if (!socket?.connected || !roomId) {
      console.error('Cannot toggle ready: not connected or no room');
      return;
    }

    socket.emit('toggleReady', { 
      roomId,
      playerId: socket.id,
      nickname: myNickname
    });
  }, [socket, playersReady, myNickname]);

  const sendWinner = (winner) => {
    if (role !== 'host') return;
    socket?.emit('gameWinner', { roomId, winner, score });
  };

  // Consolidate ALL socket event handlers in one effect
  useEffect(() => {
    if (!socket) return;

    let lastPingSent = Date.now();
    const pingInterval = setInterval(() => {
      const now = Date.now();
      lastPingSent = now;
      socket.emit('ping', now);
    }, 1000);

    socket.on('pong', (serverTime) => {
      const now = Date.now();
      const latency = now - lastPingSent;
      
      const newStats = {
        latency,
        quality: latency < 50 ? 'good' : latency < 100 ? 'medium' : 'poor'
      };
      setNetworkStats(newStats);
      onNetworkStatsUpdate(newStats);
    });

    const handlers = {
      connect: () => {
        console.log('Socket connected:', { 
          id: socket.id, 
          transport: socket.io.engine.transport.name,
          connected: socket.connected
        });
        setError(null);
        onLoadingChange(false);
      },

      disconnect: (reason) => {
        console.log('Socket disconnected:', { reason, id: socket.id });
        onLoadingChange(true);
      },

      pong: () => {
        const now = Date.now();
        const latency = Math.round((now - lastPingSent) / 2);
        console.log('Ping debug:', {
          now,
          lastPingSent,
          timeDiff: now - lastPingSent,
          calculatedLatency: latency
        });
        
        const newStats = {
          latency,
          quality: latency < 50 ? 'good' : latency < 100 ? 'medium' : 'poor'
        };
        setNetworkStats(newStats);
        onNetworkStatsUpdate(newStats);
      },

      paddleUpdate: ({ position, paddleSide, timestamp }) => {
        console.log('Received paddle update:', { 
          position, 
          paddleSide, 
          timestamp,
          currentRole: role,
          roomId,
          socketId: socketRef.current?.id
        });
        
        // Update the appropriate paddle position based on role
        if ((role === 'host' && paddleSide === 'right') || 
            (role === 'client' && paddleSide === 'left')) {
          requestAnimationFrame(() => {
            if (paddleSide === 'left') {
              setLeftPaddlePos(position);
            } else {
              setRightPaddlePos(position);
            }
          });
        }
      },

      ballUpdate: ({ position, velocity, timestamp }) => {
        if (role === 'host') return; // Host manages its own ball
        
        console.log('Client received ball update:', { 
          position, 
          velocity, 
          timestamp,
          currentRole: role,
          roomId,
          socketId: socketRef.current?.id
        });
        
        // Only update if we're the client
        if (role === 'client') {
          requestAnimationFrame(() => {
            setBallPos(position);
            setBallVelocity(velocity);
          });
        }
      },

      scoreUpdate: ({ score, scorer, timestamp }) => {
        console.log('Received score update:', { score, scorer, timestamp });
        setScore(score);
      },

      winnerUpdate: ({ winner, score }) => {
        console.log('Received winner update:', { winner, score });
        setScore(score);
        setWinner(winner);
        if (setIsGameStarted) {
          setIsGameStarted(false);
        }
        onWinnerUpdate?.(winner);
      },

      gameReady: () => {
        console.log('Game ready - all players ready');
        setIsReady(true);
        onGameStart();
      },

      playerDisconnected: () => {
        setError('Other player disconnected');
        setIsReady(false);
        onGameEnd();
      },

      roomCreated: ({ roomId, sessionId, role: assignedRole, readyState }) => {
        console.log('Room created event received:', { 
          roomId, 
          sessionId, 
          role: assignedRole, 
          readyState 
        });
        setRoomId(roomId);
        setSessionId(sessionId);
        setRole(assignedRole);
        setIsCreatingRoom(false);
        setPlayersReady(new Map(readyState));
        saveSession(roomId, sessionId);
      },

      roomJoined: ({ roomId, sessionId, role: assignedRole, readyState }) => {
        console.log('Room joined:', { roomId, role: assignedRole, readyState });
        setRoomId(roomId);
        setSessionId(sessionId);
        setRole(assignedRole);
        setIsJoiningRoom(false);
        setPlayersReady(new Map(readyState));
        saveSession(roomId, sessionId);
      },

      playerJoined: ({ playerId, readyState, nickname }) => {
        console.log('Player joined:', { playerId, readyState, nickname });
        if (readyState) {
          setPlayersReady(new Map(readyState));
        }
        if (nickname) {
          setPlayerNicknames(prev => {
            const newNicknames = new Map(prev);
            newNicknames.set(playerId, nickname);
            return newNicknames;
          });
        }
      },

      readyStateUpdate: ({ readyState, nicknames }) => {
        console.log('Ready state update received:', { readyState, nicknames });
        if (readyState) {
          const newReadyState = new Map(readyState);
          setPlayersReady(newReadyState);
          
          // Check if all players are ready
          const allReady = Array.from(newReadyState.values()).every(ready => ready);
          if (allReady && newReadyState.size === 2) {
            console.log('All players ready, starting game...');
            onGameStart?.();
          }
        }
        if (nicknames) {
          setPlayerNicknames(new Map(nicknames));
        }
      },

      roomError: (error) => {
        console.log('Room error:', error);
        setError(error);
        setIsCreatingRoom(false);
        setIsJoiningRoom(false);
      },

      rematchAccepted: () => {
        console.log('Rematch accepted, resetting game state');
        // Reset game state
        setWinner(null);
        setScore({ left: 0, right: 0 });
        setRematchRequested(false);
        setRematchAccepted(false);
        
        // Explicitly reset ready states for both players
        const newReadyState = new Map(
          Array.from(playersReady.keys()).map(id => [id, false])
        );
        setPlayersReady(newReadyState);
        setIsReady(false);
        
        // Reset game flags
        setIsGameStarted(false);
      },

      playerExited: () => {
        console.log('Player exited, cleaning up game state');
        setError('Other player has left the game');
        onGameEnd();
        setIsGameStarted(false);
        setWinner(null);
        setIsReady(false);
        
        // Auto cleanup after showing message
        setTimeout(() => {
          setError(null);
          clearSession();
          disconnect();
        }, 3000);
      },

      ballSpeedSync: ({ velocity }) => {
        if (role === 'client') {
          setBallVelocity(velocity);
        }
      },

      rematchRequest: ({ roomId }) => {
        if (!roomId) return;
        
        const room = rooms.get(roomId);
        if (!room) return;
        
        console.log('Rematch requested:', {
          roomId,
          from: socket.id
        });
        
        // Reset room state with both players explicitly not ready
        room.readyState = new Map(room.players.map(id => [id, false]));
        room.score = { left: 0, right: 0 };
        
        // Notify all players with new ready state
        io.to(roomId).emit('readyStateUpdate', {
          readyState: Array.from(room.readyState.entries())
        });
        
        // Notify other player about rematch request
        socket.to(roomId).emit('rematchRequest');
      },

      pauseUpdate: ({ isPaused, countdownValue, timestamp, from }) => {
        console.log('Received pause update:', {
          isPaused,
          countdownValue,
          timestamp,
          from
        });
        
        onPauseUpdate?.({
          isPaused,
          countdownValue
        });

        // Start countdown if game is resuming
        if (!isPaused && countdownValue) {
          let count = countdownValue;
          const countdownInterval = setInterval(() => {
            count--;
            onCountdownUpdate?.(count);
            
            if (count <= 0) {
              clearInterval(countdownInterval);
            }
          }, 1000);
        }
      }
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup
    return () => {
      clearInterval(pingInterval);
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [
    socket,
    role,
    setBallPos,
    setBallVelocity,
    setLeftPaddlePos,
    setRightPaddlePos,
    setScore,
    onPauseUpdate,
    onCountdownUpdate,
    onGameStart,
    onGameEnd,
    onWinnerUpdate,
    onNetworkStatsUpdate,
    setWinner,
    setIsGameStarted
  ]);

  // Keep time sync separate as it's on a different interval
  useEffect(() => {
    if (!socket) return;
    
    const syncTime = () => {
      const clientTime = performance.now();
      socket.emit('timeSync');
      
      const handleTimeSync = (serverTime) => {
        const roundTripTime = performance.now() - clientTime;
        const offset = serverTime - (clientTime + roundTripTime / 2);
        setServerTimeOffset(offset);
      };
      
      socket.once('timeSyncResponse', handleTimeSync);
    };
    
    syncTime();
    const interval = setInterval(syncTime, 30000);
    
    return () => clearInterval(interval);
  }, [socket]);

  // Add new handler for room rejoining
  useEffect(() => {
    if (!socket || !isReconnecting || !roomId || !sessionId) return;

    console.log('Attempting to rejoin room:', { roomId, sessionId });
    socket.emit('rejoinRoom', { roomId, sessionId });

    const handleRoomRejoined = ({ roomId, role: newRole, readyState }) => {
      console.log('Successfully rejoined room:', { roomId, role: newRole });
      setRole(newRole);
      setPlayersReady(new Map(readyState));
      setIsReconnecting(false);
    };

    socket.on('roomRejoined', handleRoomRejoined);

    return () => {
      socket.off('roomRejoined', handleRoomRejoined);
    };
  }, [socket, isReconnecting, roomId, sessionId]);

  const connectWithRetry = useCallback(async () => {
    try {
      if (retryCount >= MAX_RETRIES) {
        setError({
          message: 'Failed to connect after multiple attempts',
          type: 'FATAL',
          description: 'Please check your internet connection and try again later'
        });
        return;
      }

      console.log(`Attempting to connect (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await socket.connect();
      setRetryCount(0); // Reset on successful connection
      
    } catch (error) {
      setRetryCount(prev => prev + 1);
      setError({
        message: error.message || 'Connection failed',
        type: 'RETRY',
        description: `Retrying in ${RETRY_DELAY/1000} seconds...`
      });
      
      setTimeout(connectWithRetry, RETRY_DELAY);
    }
  }, [retryCount, socket]);

  // Update initialization
  useEffect(() => {
    if (!socket) return;
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      connectWithRetry();
    });

    socket.on('connect_timeout', () => {
      console.error('Socket connection timeout');
      connectWithRetry();
    });

    return () => {
      socket.off('connect_error');
      socket.off('connect_timeout');
    };
  }, [socket, connectWithRetry]);

  // Add connection status monitoring
  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    };

    const handleReconnect = (attempt) => {
      console.log('Socket reconnected after', attempt, 'attempts');
      setError(null);
      setRetryCount(0);
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket]);

  return {
    socket: socketRef.current,
    mySocketId: socket?.id,
    roomId,
    error,
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
    networkStats,
    isConnected: !!socket?.connected,
    paddleBuffer: paddleBufferRef.current,
    isCreatingRoom,
    isJoiningRoom,
    isSocketReady,
    playerNicknames
  };
} 