import styles from '../../styles/components/game/GameField.module.css';

export function GameField({ ballPosition, paddlePositions }) {
  if (!ballPosition || !paddlePositions) {
    return <div className={styles.gameField}>Loading...</div>;
  }

  return (
    <div className={styles.gameField}>
      {/* Center line */}
      <div className={styles.centerLine} />
      
      {/* Ball */}
      <div 
        className={styles.ball}
        style={{
          transform: `translate(${ballPosition.x}px, ${ballPosition.y}px)`,
          width: '15px',  // Square ball
          height: '15px'  // Square ball
        }}
      />
      
      {/* Paddles */}
      <div 
        className={styles.paddle}
        style={{
          left: 0,
          top: paddlePositions.left.y,
          height: '100px'
        }}
      />
      <div 
        className={styles.paddle}
        style={{
          right: 0,
          top: paddlePositions.right.y,
          height: '100px'
        }}
      />
    </div>
  );
} 