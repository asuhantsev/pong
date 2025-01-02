import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useMultiplayer } from '../hooks/useMultiplayer';
import { useSelector, useDispatch } from '../store/store';
import { gameActions } from '../store/actions';
import Logger from '../utils/logger';
import { useLocation } from 'react-router-dom';

const MultiplayerContext = createContext(null);

export function MultiplayerProvider({ children }) {
  const [nickname, setNickname] = useState(localStorage.getItem('nickname') || '');
  const location = useLocation();
  const isMultiplayerRoute = location.pathname.includes('/multiplayer') || 
    (location.pathname.includes('/game/') && location.search);

  const {
    socket,
    mySocketId,
    roomId,
    sessionId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    ...socketHandlers
  } = useMultiplayer({
    nickname,
    enabled: isMultiplayerRoute,
    mode: isMultiplayerRoute ? 'multiplayer' : 'single'
  });

  // Only connect in multiplayer routes
  useEffect(() => {
    if (isMultiplayerRoute && !isConnected && !isConnecting) {
      Logger.info('MultiplayerContext', 'Connecting to server in multiplayer mode');
      connect();
    }
    if (!isMultiplayerRoute && isConnected) {
      Logger.info('MultiplayerContext', 'Disconnecting from server in single-player mode');
      disconnect();
    }
  }, [isMultiplayerRoute, isConnected, isConnecting, connect, disconnect]);

  const value = useMemo(() => ({
    socket,
    mySocketId,
    roomId,
    sessionId,
    isConnected,
    isConnecting,
    error,
    nickname,
    setNickname: (newNickname) => {
      localStorage.setItem('nickname', newNickname);
      setNickname(newNickname);
    },
    ...socketHandlers
  }), [
    socket,
    mySocketId,
    roomId,
    sessionId,
    isConnected,
    isConnecting,
    error,
    nickname,
    socketHandlers
  ]);

  return (
    <MultiplayerContext.Provider value={value}>
      {children}
    </MultiplayerContext.Provider>
  );
}

export function useMultiplayerContext() {
  const context = useContext(MultiplayerContext);
  if (!context) {
    throw new Error('useMultiplayerContext must be used within a MultiplayerProvider');
  }
  return context;
} 