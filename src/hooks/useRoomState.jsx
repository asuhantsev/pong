import { useState, useCallback } from 'react';

export function useRoomState() {
  const [roomState, setRoomState] = useState({
    roomId: null,
    role: null,
    playersReady: new Map(),
    playerNicknames: new Map(),
    isReconnecting: false,
    isCreatingRoom: false,
    isJoiningRoom: false
  });

  const updateRoomState = useCallback((updates) => {
    setRoomState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetRoomState = useCallback(() => {
    setRoomState({
      roomId: null,
      role: null,
      playersReady: new Map(),
      playerNicknames: new Map(),
      isReconnecting: false,
      isCreatingRoom: false,
      isJoiningRoom: false
    });
  }, []);

  return {
    ...roomState,
    updateRoomState,
    resetRoomState
  };
} 