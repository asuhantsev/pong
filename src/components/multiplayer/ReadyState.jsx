import styles from '../../styles/components/multiplayer/ReadyState.module.css';
import buttonStyles from '../../styles/components/shared/Button.module.css';
import cardStyles from '../../styles/components/shared/Card.module.css';
import typographyStyles from '../../styles/components/shared/Typography.module.css';
import gridStyles from '../../styles/components/shared/Grid.module.css';

export function ReadyState({
  playersReady,
  mySocketId,
  playerNicknames,
  onToggleReady,
  isReconnecting
}) {
  const isReady = playersReady.get(mySocketId);

  return (
    <div className={styles.container}>
      <div className={`${gridStyles.grid} ${gridStyles.gap2}`}>
        {Array.from(playersReady.entries()).map(([id, ready]) => {
          const isCurrentPlayer = id === mySocketId;
          const playerNickname = playerNicknames.get(id) || 'Unknown';
          
          return (
            <div 
              key={id} 
              className={`${cardStyles.card} ${isCurrentPlayer ? styles.currentPlayer : ''}`}
            >
              <div className={styles.playerInfo}>
                <span className={typographyStyles.text}>
                  {playerNickname} {isCurrentPlayer ? '(You)' : ''}
                </span>
                <span className={styles.readyIndicator}>
                  {ready ? '✅' : '⏳'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        className={`${buttonStyles.large} ${isReady ? buttonStyles.secondary : ''}`}
        onClick={onToggleReady}
        disabled={isReconnecting}
      >
        {isReady ? 'Ready!' : 'Click when Ready'}
      </button>
    </div>
  );
} 