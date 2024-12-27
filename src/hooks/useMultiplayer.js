import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { BOARD_HEIGHT, PADDLE_HEIGHT } from '../constants/gameConstants';

const SOCKET_SERVER = import.meta.env.PROD 
  ? 'https://pong-322h.onrender.com'  // Replace with your actual Render URL
  : 'http://localhost:3001';
const STORAGE_KEY = 'pong_session';

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
  onNetworkStatsUpdate
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
  const [winner, setWinner] = useState(null);
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [networkStats, setNetworkStats] = useState({
    latency: 0,
    quality: 'good'
  });
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);

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
    if (socketRef.current) return;
    
    const newSocket = io(SOCKET_SERVER, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      extraHeaders: {
        "my-custom-header": "abcd"
      }
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
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
    if (!socketRef.current) {
      console.log('❌ Cannot create room: Socket not connected');
      return;
    }
    setIsCreatingRoom(true);
    socketRef.current.emit('createRoom');
  }, []);

  const joinRoom = useCallback((roomId) => {
    if (!socketRef.current) {
      console.log('❌ Cannot join room: Socket not connected');
      return;
    }
    if (!roomId) {
      setError('Room code is required');
      return;
    }
    setIsJoiningRoom(true);
    console.log('Joining room:', roomId);
    socketRef.current.emit('joinRoom', roomId);
  }, []);

  // Add throttling for paddle updates
  const THROTTLE_MS = 16; // roughly 60fps
  
  // Throttled paddle movement sender
  const sendPaddleMove = useCallback((position, paddleSide) => {
    if (!socket || !roomId) return;

    const now = Date.now();
    if (now - lastPaddleUpdate >= THROTTLE_MS) {
      socket.emit('paddleMove', {
        position,
        paddleSide,
        timestamp: now
      });
      lastPaddleUpdate = now;
    }
  }, [socket, roomId]);

  // Ball movement sender (using the same lastBallUpdate variable)
  const sendBallMove = useCallback((position, velocity) => {
    if (!socket || !roomId || role !== 'host') return;
    
    const now = Date.now();
    if (now - lastBallUpdate >= THROTTLE_MS) {
      socket.emit('ballMove', { 
        position, 
        velocity
      });
      lastBallUpdate = now;
    }
  }, [socket, roomId, role]);

  // Update score handling to prevent double counting
  const sendScore = (score, scorer) => {
    if (role !== 'host') return; // Only host can update score
    socket?.emit('score', { roomId, score, scorer });
  };

  const toggleReady = () => {
    if (!socket || !roomId) {
      console.log('❌ Cannot toggle ready: No socket or room');
      return;
    }
    
    console.log('=== Toggle Ready Request ===', {
      socketId: socket.id,
      roomId,
      role,
      currentReadyState: Array.from(playersReady.entries())
    });
    
    socket.emit('toggleReady', roomId);
  };

  const sendWinner = (winner) => {
    if (role !== 'host') return;
    socket?.emit('winner', { roomId, winner });
  };

  // Consolidate ALL socket event handlers in one effect
  useEffect(() => {
    if (!socket) return;

    let lastPingSent = 0;
    const pingInterval = setInterval(() => {
      lastPingSent = Date.now();
      socket.emit('ping');
    }, 1000);

    const handlers = {
      connect: () => {
        console.log('Socket connected:', { id: socket.id, roomId, role });
        setError(null);
        onLoadingChange(false);
      },

      disconnect: (reason) => {
        console.log('Socket disconnected:', { reason, id: socket.id });
        onLoadingChange(true);
      },

      pong: () => {
        const latency = Date.now() - lastPingSent;
        const newStats = {
          latency,
          quality: latency < 50 ? 'good' : latency < 100 ? 'medium' : 'poor'
        };
        setNetworkStats(newStats);
        onNetworkStatsUpdate(newStats);
      },

      paddleUpdate: ({ position, paddleSide, timestamp }) => {
        // Don't process updates for the paddle we control
        if ((role === 'host' && paddleSide === 'left') || 
            (role === 'client' && paddleSide === 'right')) {
          return;
        }

        // Ensure position is within boundaries
        const boundedPosition = Math.max(
          0,
          Math.min(
            BOARD_HEIGHT - PADDLE_HEIGHT,
            position
          )
        );

        // Add to appropriate buffer with server timestamp
        paddleBufferRef.current[paddleSide].push({
          position: boundedPosition,
          timestamp: timestamp
        });

        // Keep only last few positions
        if (paddleBufferRef.current[paddleSide].length > 3) {
          paddleBufferRef.current[paddleSide].shift();
        }
      },

      ballUpdate: ({ position, velocity, timestamp }) => {
        if (role === 'host') return;
        
        console.log('Received ball update:', { position, velocity, timestamp });
        setBallPos(position);
        setBallVelocity(velocity);
      },

      scoreUpdate: ({ score, scorer }) => {
        console.log('Received score update:', { score, scorer });
        setScore(score);
      },

      pauseUpdate: ({ isPaused, countdownValue }) => {
        console.log('Received pause update:', { isPaused, countdownValue });
        if (typeof isPaused === 'boolean') onPauseUpdate(isPaused);
        if (typeof countdownValue === 'number') onCountdownUpdate(countdownValue);
      },

      winnerUpdate: (winner) => {
        console.log('Received winner update:', winner);
        onWinnerUpdate(winner);
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
        console.log('Room created:', { roomId, readyState });
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

      playerJoined: ({ playerId, readyState }) => {
        console.log('Player joined:', { playerId, readyState });
        setPlayersReady(new Map(readyState));
      },

      readyStateUpdate: ({ readyState }) => {
        console.log('Ready state update:', readyState);
        setPlayersReady(new Map(readyState));
      },

      roomError: (error) => {
        console.log('Room error:', error);
        setError(error);
        setIsCreatingRoom(false);
        setIsJoiningRoom(false);
      }
    };

    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

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
    onLoadingChange,
    onNetworkStatsUpdate
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
    isJoiningRoom
  };
} 