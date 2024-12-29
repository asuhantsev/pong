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
          transform: `translate(${ballPos.x}px, ${ballPos.y}px)`
        }}
      />
      
      {/* Paddles */}
      <div 
        className={styles.paddle}
        style={{
          left: 0,
          top: leftPaddlePos
        }}
      />
      <div 
        className={styles.paddle}
        style={{
          right: 0,
          top: rightPaddlePos
        }}
      />
    </div>
  );
} 