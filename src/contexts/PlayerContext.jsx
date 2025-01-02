import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import StorageManager from '../utils/StorageManager';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [playerState, setPlayerState] = useState({
    nickname: StorageManager.getNickname(),
    isReady: false,
    role: null,
    paddlePosition: 0
  });

  const socket = useSocket();

  const updateNickname = useCallback((newNickname) => {
    StorageManager.saveNickname(newNickname);
    setPlayerState(prev => ({ ...prev, nickname: newNickname }));
    if (socket) {
      socket.emit('nicknameUpdate', { nickname: newNickname });
    }
  }, [socket]);

  const toggleReady = useCallback((roomId) => {
    setPlayerState(prev => {
      const newState = { ...prev, isReady: !prev.isReady };
      if (socket) {
        socket.emit('toggleReady', { roomId, isReady: newState.isReady });
      }
      return newState;
    });
  }, [socket]);

  const updatePaddlePosition = useCallback((position) => {
    setPlayerState(prev => ({ ...prev, paddlePosition: position }));
    if (socket) {
      socket.emit('paddleMove', { position });
    }
  }, [socket]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Add any socket event listeners here
    // Example:
    // socket.on('playerUpdate', handlePlayerUpdate);

    return () => {
      // Clean up listeners
      // socket.off('playerUpdate', handlePlayerUpdate);
    };
  }, [socket]);

  return (
    <PlayerContext.Provider value={{
      ...playerState,
      updateNickname,
      toggleReady,
      updatePaddlePosition,
      setPlayerState,
      isConnected: !!socket
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}; 