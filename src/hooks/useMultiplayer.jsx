import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { BOARD_HEIGHT, PADDLE_HEIGHT } from '../constants/gameConstants';
import { isValidNickname } from '../utils/validation';
import { useDispatch } from '../store/store';
import Logger from '../utils/logger';

const SOCKET_SERVER = import.meta.env.PROD 
  ? 'https://pong-322h.onrender.com'
  : 'http://localhost:3001';
const STORAGE_KEY = 'pong_session';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const SOCKET_OPTIONS = {
  transports: ['polling', 'websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: true,
  path: '/socket.io/',
  autoConnect: false,
  reconnection: true,
  withCredentials: true,
  secure: true,
  rejectUnauthorized: false
};

export function useMultiplayer({ 
  nickname = 'Player',
  mode,
  enabled = false
}) {
  const [socket, setSocket] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const retryCountRef = useRef(0);
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  const connect = useCallback(() => {
    if (!enabled || mode !== 'multiplayer' || socket || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      // Clean up existing socket if any
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const newSocket = io(SOCKET_SERVER, SOCKET_OPTIONS);
      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        Logger.info('Socket', 'Connected to server');
        setIsConnecting(false);
        setIsConnected(true);
        setSocket(newSocket);
        setMySocketId(newSocket.id);
        retryCountRef.current = 0;
      });

      newSocket.on('connect_error', (error) => {
        Logger.warn('Socket', 'Connection error', error);
        setIsConnecting(false);
        setError('Failed to connect to server');
        
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(connect, RETRY_DELAY);
        }
      });

      newSocket.on('disconnect', (reason) => {
        Logger.warn('Socket', 'Disconnected from server', reason);
        setIsConnected(false);
        setSocket(null);
        
        // Don't attempt to reconnect in single-player mode
        if (mode === 'single') return;
        
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          setTimeout(connect, RETRY_DELAY);
        }
      });

      newSocket.connect();

    } catch (error) {
      Logger.error('Socket', 'Failed to initialize socket', error);
      setIsConnecting(false);
      setError('Failed to initialize connection');
    }
  }, [enabled, mode, socket, isConnecting]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      setMySocketId(null);
      setRoomId(null);
      setSessionId(null);
    }
  }, []);

  // Connect/disconnect based on enabled flag
  useEffect(() => {
    if (enabled && !socket && !isConnecting) {
      connect();
    }
    return () => {
      if (socket) {
        disconnect();
      }
    };
  }, [enabled, socket, isConnecting, connect, disconnect]);

  return {
    socket,
    mySocketId,
    roomId,
    sessionId,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  };
} 