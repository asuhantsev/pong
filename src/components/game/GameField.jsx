import styles from '../../styles/components/game/GameField.module.css';

export function GameField({ ballPos, leftPaddlePos, rightPaddlePos }) {
  return (
    <div className={styles.gameField}>
      {/* Center line */}
      <div className={styles.centerLine} />
      
      {/* Ball */}
      <div 
        className={styles.ball}
        style={{
          transform: `translate(${ballPos.x}px, ${ballPos.y}px)`,
          width: '15px',  // Square ball
          height: '15px'  // Square ball
        }}
      />
      
      {/* Paddles */}
      <div 
        className={styles.paddle}
        style={{
          left: 0,
          top: leftPaddlePos,
          height: '100px'
        }}
      />
      <div 
        className={styles.paddle}
        style={{
          right: 0,
          top: rightPaddlePos,
          height: '100px'
        }}
      />
    </div>
  );
} 