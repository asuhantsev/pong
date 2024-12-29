import { createContext, useContext, useState, useCallback } from 'react';
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

  const { emit } = useSocket();

  const updateNickname = useCallback((newNickname) => {
    StorageManager.setNickname(newNickname);
    setPlayerState(prev => ({ ...prev, nickname: newNickname }));
    emit('nicknameUpdate', { nickname: newNickname });
  }, [emit]);

  const toggleReady = useCallback((roomId) => {
    setPlayerState(prev => {
      const newState = { ...prev, isReady: !prev.isReady };
      emit('toggleReady', { roomId, isReady: newState.isReady });
      return newState;
    });
  }, [emit]);

  const updatePaddlePosition = useCallback((position) => {
    setPlayerState(prev => ({ ...prev, paddlePosition: position }));
    emit('paddleMove', { position });
  }, [emit]);

  return (
    <PlayerContext.Provider value={{
      ...playerState,
      updateNickname,
      toggleReady,
      updatePaddlePosition,
      setPlayerState
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext); 