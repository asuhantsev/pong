import { createContext, useContext, useState, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useError } from './ErrorContext';

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

  const { socket, emit } = useSocket();
  const { setError } = useError();

  const createRoom = useCallback(async () => {
    if (!socket?.connected) {
      throw new Error('Not connected to server');
    }

    setRoomState(prev => ({ ...prev, isCreatingRoom: true }));
    
    try {
      await emit('createRoom');
    } catch (err) {
      setError('room', 'Failed to create room');
      setRoomState(prev => ({ ...prev, isCreatingRoom: false }));
    }
  }, [socket, emit, setError]);

  const joinRoom = useCallback(async (roomId) => {
    if (!socket?.connected) {
      throw new Error('Not connected to server');
    }

    setRoomState(prev => ({ ...prev, isJoiningRoom: true }));
    
    try {
      await emit('joinRoom', roomId);
    } catch (err) {
      setError('room', 'Failed to join room');
      setRoomState(prev => ({ ...prev, isJoiningRoom: false }));
    }
  }, [socket, emit, setError]);

  const value = {
    ...roomState,
    createRoom,
    joinRoom,
    updateRoomState: useCallback((updates) => {
      setRoomState(prev => ({ ...prev, ...updates }));
    }, [])
  };

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export const useRoom = () => useContext(RoomContext); 