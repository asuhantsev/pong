import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useError } from './ErrorContext';
import Logger from '../utils/logger';

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [roomState, setRoomState] = useState({
    roomId: null,
    role: null,
    playersReady: new Map(),
    playerNicknames: new Map(),
    isReconnecting: false,
    isCreatingRoom: false,
    isJoiningRoom: false
  });

  const socket = useSocket();
  const { setError } = useError();

  const createRoom = useCallback(async () => {
    if (!socket?.connected) {
      setError('room', 'Not connected to server');
      return;
    }

    setRoomState(prev => ({ ...prev, isCreatingRoom: true }));
    
    try {
      await socket.emit('createRoom');
    } catch (err) {
      Logger.error('RoomContext', 'Failed to create room', err);
      setError('room', 'Failed to create room');
      setRoomState(prev => ({ ...prev, isCreatingRoom: false }));
    }
  }, [socket, setError]);

  const joinRoom = useCallback(async (roomId) => {
    if (!socket?.connected) {
      setError('room', 'Not connected to server');
      return;
    }

    setRoomState(prev => ({ ...prev, isJoiningRoom: true }));
    
    try {
      await socket.emit('joinRoom', roomId);
    } catch (err) {
      Logger.error('RoomContext', 'Failed to join room', err);
      setError('room', 'Failed to join room');
      setRoomState(prev => ({ ...prev, isJoiningRoom: false }));
    }
  }, [socket, setError]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (roomId) => {
      setRoomState(prev => ({
        ...prev,
        roomId,
        role: 'host',
        isCreatingRoom: false
      }));
    };

    const handleRoomJoined = (data) => {
      setRoomState(prev => ({
        ...prev,
        roomId: data.roomId,
        role: 'guest',
        isJoiningRoom: false,
        playersReady: new Map(data.playersReady),
        playerNicknames: new Map(data.playerNicknames)
      }));
    };

    const handlePlayerJoined = (data) => {
      setRoomState(prev => ({
        ...prev,
        playersReady: new Map([...prev.playersReady, [data.playerId, false]]),
        playerNicknames: new Map([...prev.playerNicknames, [data.playerId, data.nickname]])
      }));
    };

    socket.on('roomCreated', handleRoomCreated);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('playerJoined', handlePlayerJoined);

    return () => {
      socket.off('roomCreated', handleRoomCreated);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('playerJoined', handlePlayerJoined);
    };
  }, [socket]);

  const value = {
    ...roomState,
    createRoom,
    joinRoom,
    updateRoomState: useCallback((updates) => {
      setRoomState(prev => ({ ...prev, ...updates }));
    }, []),
    isConnected: !!socket?.connected
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}; 