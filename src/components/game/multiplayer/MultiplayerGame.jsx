import { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ErrorBoundary } from '../../shared/ErrorBoundary';
import { ReadyState } from './ReadyState';
import { RoomInfo } from './RoomInfo';
import styles from '../../../styles/components/game/multiplayer/MultiplayerGame.module.css';
import layoutStyles from '../../../styles/components/shared/Layout.module.css';
import Logger from '../../../utils/logger';

export const MultiplayerGame = memo(function MultiplayerGame({
  roomId,
  playersReady,
  playerNicknames,
  isReconnecting,
  nickname,
  isReady,
  role,
  onToggleReady,
  onLeaveRoom,
  error
}) {
  // Error handling callbacks
  const handleReadyStateError = useCallback((error, errorInfo) => {
    Logger.error('MultiplayerGame', 'ReadyState error', { error, errorInfo });
  }, []);

  const handleRoomInfoError = useCallback((error, errorInfo) => {
    Logger.error('MultiplayerGame', 'RoomInfo error', { error, errorInfo });
  }, []);

  // Custom error fallbacks
  const readyStateErrorFallback = (error, resetError) => (
    <div className={styles.errorFallback}>
      <h3>Ready State Error</h3>
      <p>Unable to update player ready status.</p>
      <button onClick={resetError}>Try Again</button>
    </div>
  );

  const roomInfoErrorFallback = (error, resetError) => (
    <div className={styles.errorFallback}>
      <h3>Room Info Error</h3>
      <p>Unable to display room information.</p>
      <button onClick={resetError}>Refresh</button>
    </div>
  );

  return (
    <div className={`
      ${layoutStyles.flexColumn}
      ${layoutStyles.itemsCenter}
      ${styles.container}
    `}>
      <ErrorBoundary
        componentName="RoomInfo"
        onError={handleRoomInfoError}
        fallback={roomInfoErrorFallback}
      >
        <RoomInfo
          roomId={roomId}
          playerNicknames={playerNicknames}
          role={role}
          onLeaveRoom={onLeaveRoom}
        />
      </ErrorBoundary>

      <ErrorBoundary
        componentName="ReadyState"
        onError={handleReadyStateError}
        fallback={readyStateErrorFallback}
      >
        <ReadyState
          playersReady={playersReady}
          nickname={nickname}
          isReady={isReady}
          isReconnecting={isReconnecting}
          onToggleReady={onToggleReady}
        />
      </ErrorBoundary>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
});

MultiplayerGame.propTypes = {
  roomId: PropTypes.string.isRequired,
  playersReady: PropTypes.instanceOf(Map).isRequired,
  playerNicknames: PropTypes.instanceOf(Map).isRequired,
  isReconnecting: PropTypes.bool,
  nickname: PropTypes.string.isRequired,
  isReady: PropTypes.bool.isRequired,
  role: PropTypes.oneOf(['host', 'guest']),
  onToggleReady: PropTypes.func.isRequired,
  onLeaveRoom: PropTypes.func.isRequired,
  error: PropTypes.string
};

MultiplayerGame.defaultProps = {
  isReconnecting: false,
  role: null,
  error: null
}; 