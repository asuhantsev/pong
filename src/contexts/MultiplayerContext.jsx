import { createContext, useContext, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import Logger from '../utils/logger';

const MultiplayerContext = createContext(null);

const NICKNAME_STORAGE_KEY = 'pong-nickname';

export function MultiplayerProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [nickname, setNickname] = useState(() => 
    localStorage.getItem(NICKNAME_STORAGE_KEY) || 'Player'
  );

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    if (socket) return;

    try {
      const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: false
      });

      newSocket.on('connect', () => {
        Logger.info('Socket', 'Connected to server');
        setIsConnecting(false);
        setError(null);
      });

      newSocket.on('connect_error', (err) => {
        Logger.error('Socket', 'Connection error', err);
        setError('Failed to connect to server');
        setIsConnecting(false);
      });

      newSocket.on('error', (err) => {
        Logger.error('Socket', 'Socket error', err);
        setError(err.message || 'An error occurred');
      });

      setSocket(newSocket);
    } catch (err) {
      Logger.error('Socket', 'Failed to initialize socket', err);
      setError('Failed to initialize connection');
      setIsConnecting(false);
    }
  }, [socket]);

  // Create a new room
  const createRoom = useCallback(async () => {
    if (!socket) {
      initializeSocket();
    }

    setIsConnecting(true);
    setError(null);

    try {
      socket.connect();
      socket.emit('create_room', { nickname }, (response) => {
        if (response.error) {
          setError(response.error);
        } else {
          setRoomId(response.roomId);
        }
        setIsConnecting(false);
      });
    } catch (err) {
      Logger.error('Multiplayer', 'Failed to create room', err);
      setError('Failed to create room');
      setIsConnecting(false);
    }
  }, [socket, nickname, initializeSocket]);

  // Join an existing room
  const joinRoom = useCallback(async (roomId) => {
    if (!socket) {
      initializeSocket();
    }

    setIsConnecting(true);
    setError(null);

    try {
      socket.connect();
      socket.emit('join_room', { roomId, nickname }, (response) => {
        if (response.error) {
          setError(response.error);
        } else {
          setRoomId(roomId);
        }
        setIsConnecting(false);
      });
    } catch (err) {
      Logger.error('Multiplayer', 'Failed to join room', err);
      setError('Failed to join room');
      setIsConnecting(false);
    }
  }, [socket, nickname, initializeSocket]);

  // Update nickname
  const updateNickname = useCallback((newNickname) => {
    setNickname(newNickname);
    localStorage.setItem(NICKNAME_STORAGE_KEY, newNickname);
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setRoomId(null);
      setError(null);
      setIsConnecting(false);
    }
  }, [socket]);

  const value = {
    socket,
    isConnecting,
    error,
    roomId,
    nickname,
    createRoom,
    joinRoom,
    updateNickname,
    cleanup
  };

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayer() {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider');
  }
  return context;
} 