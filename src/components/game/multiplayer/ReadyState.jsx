import styles from '../../../styles/components/multiplayer/ReadyState.module.css';

export function ReadyState({ 
  playersReady, 
  mySocketId, 
  playerNicknames,
  onToggleReady,
  isReconnecting 
}) {
  const isReady = playersReady.get(mySocketId) || false;
  const bothConnected = playersReady.size === 2;

  return (
    <div className={styles.container}>
      <button 
        onClick={onToggleReady}
        disabled={!bothConnected || isReconnecting}
        className={`${styles.readyButton} ${isReady ? styles.ready : ''}`}
      >
        {isReady ? 'Ready!' : 'Click when Ready'}
      </button>
      <div className={styles.statusList}>
        {Array.from(playersReady.entries()).map(([id, ready]) => {
          const isMe = id === mySocketId;
          const nickname = isMe ? 'You' : playerNicknames.get(id);
          
          return (
            <div 
              key={id} 
              className={`${styles.playerEntry} ${isMe ? styles.currentPlayer : ''}`}
            >
              <div className={styles.playerInfo}>
                <span className={styles.playerNickname}>
                  {nickname || 'Unknown'} {isMe ? '(You)' : ''}
                </span>
                <span className={styles.readyIndicator}>
                  {ready ? '✅' : '⏳'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 