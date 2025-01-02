import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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
        reconnectAttemptsRef.current = 0;
        setSocket(socketInstance);
      };

      const handleConnectError = (error) => {
        Logger.warn('Socket', 'Connection error', error.message);
        setIsConnecting(false);
        
        if (reconnectAttemptsRef.current >= RECONNECTION_ATTEMPTS) {
          setError('socket', 'Failed to connect to server. Please check if the server is running.');
          socketInstance.disconnect();
          setSocket(null);
        } else {
          reconnectAttemptsRef.current += 1;
          const nextAttemptIn = RECONNECTION_DELAY / 1000;
          setError('socket', `Connection failed. Retrying in ${nextAttemptIn} seconds...`);
          
          setTimeout(() => {
            if (socketRef.current === socketInstance) {
              Logger.info('Socket', `Attempting reconnection ${reconnectAttemptsRef.current}/${RECONNECTION_ATTEMPTS}`);
              socketInstance.connect();
            }
          }, RECONNECTION_DELAY);
        }
      };

      const handleDisconnect = (reason) => {
        Logger.warn('Socket', 'Disconnected from server', reason);
        
        // Don't clear socket state immediately on transport close
        if (reason !== 'transport close') {
          setSocket(null);
        }
        
        const shouldReconnect = ['transport close', 'transport error', 'ping timeout'].includes(reason);
        
        if (shouldReconnect && reconnectAttemptsRef.current < RECONNECTION_ATTEMPTS) {
          setTimeout(() => {
            if (socketRef.current === socketInstance) {
              Logger.info('Socket', 'Attempting to reconnect after disconnect');
              socketInstance.connect();
            }
          }, RECONNECTION_DELAY);
        }
      };

      const handleError = (error) => {
        Logger.error('Socket', 'Socket error', error);
        setError('socket', 'Connection error occurred. Please check if the server is running.');
        setSocket(null);
      };

      socketInstance.on('connect', handleConnect);
      socketInstance.on('connect_error', handleConnectError);
      socketInstance.on('disconnect', handleDisconnect);
      socketInstance.on('error', handleError);

      // Manually initiate connection
      socketInstance.connect();

      return socketInstance;
    } catch (error) {
      Logger.error('Socket', 'Failed to create socket instance', error);
      setError('socket', 'Failed to initialize connection. Please check if the server is running.');
      setIsConnecting(false);
      return null;
    }
  }, [setError]);

  useEffect(() => {
    const socketInstance = connect();

    return () => {
      if (socketRef.current) {
        Logger.info('Socket', 'Cleaning up socket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [connect]);

  const value = {
    socket,
    isConnecting,
    isConnected: socket?.connected || false,
    connect,
    reconnectAttempts: reconnectAttemptsRef.current
  };

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