import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import io from 'socket.io-client';
import { useNetwork } from './NetworkContext';
import { useError } from './ErrorContext';

const SocketContext = createContext(null);

const SOCKET_SERVER = import.meta.env.PROD 
  ? 'https://pong-322h.onrender.com'
  : 'http://localhost:3001';

const SOCKET_OPTIONS = {
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: true,
  path: '/socket.io/',
  autoConnect: false
};

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { updateNetworkStats } = useNetwork();
  const { setError, clearError } = useError();

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER, SOCKET_OPTIONS);

    newSocket.on('connect', () => {
      setIsConnected(true);
      clearError('socket');
      updateNetworkStats({ isConnected: true });
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      updateNetworkStats({ isConnected: false });
    });

    newSocket.on('connect_error', (error) => {
      setError('socket', error.message);
    });

    newSocket.on('pong', (latency) => {
      updateNetworkStats({
        latency,
        quality: latency < 50 ? 'good' : latency < 100 ? 'poor' : 'bad'
      });
    });

    setSocket(newSocket);
    newSocket.connect();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const value = {
    socket,
    isConnected,
    emit: useCallback((...args) => socket?.emit(...args), [socket])
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext); 