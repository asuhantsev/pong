import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import Logger from '../utils/logger';
import { useError } from './ErrorContext';

const SocketContext = createContext(null);
const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;
const CONNECTION_TIMEOUT = 20000;

const getSocketOptions = () => ({
  transports: ['polling', 'websocket'],
  withCredentials: false,
  reconnection: true,
  reconnectionAttempts: RECONNECTION_ATTEMPTS,
  reconnectionDelay: RECONNECTION_DELAY,
  timeout: CONNECTION_TIMEOUT,
  autoConnect: false,
  forceNew: true
});

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const socketRef = useRef(null);
  const { setError } = useError();

  const connect = useCallback(() => {
    // If we already have a socket instance, clean it up first
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    setIsConnecting(true);

    try {
      const serverUrl = import.meta.env.DEV
        ? 'http://localhost:3001'
        : 'https://pong-322h.onrender.com';

      const socketInstance = io(serverUrl, getSocketOptions());

      socketRef.current = socketInstance;

      const handleConnect = () => {
        Logger.info('Socket', 'Connected to server');
        setIsConnecting(false);
        setSocket(socketInstance);
        reconnectAttemptsRef.current = 0;
      };

      const handleConnectError = (error) => {
        Logger.warn('Socket', 'Connection error', error);
        setIsConnecting(false);
        
        if (reconnectAttemptsRef.current < RECONNECTION_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          setTimeout(connect, RECONNECTION_DELAY);
        } else {
          setError('Failed to connect to server. Please try again later.');
        }
      };

      const handleDisconnect = (reason) => {
        Logger.warn('Socket', 'Disconnected from server', reason);
        setSocket(null);
        
        // Don't attempt to reconnect if the disconnect was intentional
        if (reason === 'io client disconnect' || reason === 'io server disconnect') {
          return;
        }
        
        // Don't attempt to reconnect in single-player mode
        const path = window.location.pathname;
        if (path === '/game' && !window.location.search) {
          return;
        }

        if (reconnectAttemptsRef.current < RECONNECTION_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          setTimeout(connect, RECONNECTION_DELAY);
        }
      };

      const handleError = (error) => {
        Logger.error('Socket', 'Socket error', error);
        setError('An error occurred with the connection. Please try again.');
      };

      socketInstance.on('connect', handleConnect);
      socketInstance.on('connect_error', handleConnectError);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('error', handleError);

      socketInstance.connect();

    } catch (error) {
      Logger.error('Socket', 'Failed to create socket instance', error);
      setIsConnecting(false);
      setError('Failed to initialize connection. Please try again later.');
    }
  }, [setError]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, []);

  const value = useMemo(() => ({
    socket,
    isConnecting,
    connect,
    disconnect
  }), [socket, isConnecting, connect, disconnect]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};

export const useSocketState = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketState must be used within a SocketProvider');
  }
  return context;
}; 