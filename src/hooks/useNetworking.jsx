import { useCallback } from 'react';
import { useDispatch, useSelector } from '../store/store';
import { networkActions } from '../store/actions';
import Logger from '../utils/logger';

export function useNetworking() {
  const dispatch = useDispatch();
  const networkState = useSelector(state => state.network);

  const actions = {
    connect: useCallback((config) => {
      Logger.info('useNetworking', 'Connecting to server', config);
      dispatch(networkActions.connect(config));
    }, [dispatch]),

    disconnect: useCallback(() => {
      Logger.info('useNetworking', 'Disconnecting from server');
      dispatch(networkActions.disconnect());
    }, [dispatch]),

    joinRoom: useCallback((roomId) => {
      Logger.info('useNetworking', 'Joining room', { roomId });
      dispatch(networkActions.joinRoom(roomId));
    }, [dispatch]),

    leaveRoom: useCallback(() => {
      Logger.info('useNetworking', 'Leaving room');
      dispatch(networkActions.leaveRoom());
    }, [dispatch])
  };

  return {
    state: networkState,
    actions,
    isConnected: networkState.isConnected,
    socket: networkState.socket,
    currentRoom: networkState.currentRoom
  };
} 