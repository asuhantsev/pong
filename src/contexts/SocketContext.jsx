import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import Logger from '../utils/logger';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Use development server URL when running locally
    const serverUrl = import.meta.env.DEV
      ? 'http://localhost:3001'
      : 'https://pong-322h.onrender.com';

    const socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      Logger.info('Socket', 'Connected to server');
    });

    socketInstance.on('connect_error', (error) => {
      Logger.warn('Socket', 'Connection error', error.message);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext); 