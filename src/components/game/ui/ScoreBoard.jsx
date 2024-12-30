import styles from '../../../styles/components/game/ScoreBoard.module.css';

export function ScoreBoard({ score }) {
  return (
    <div className={styles.scoreBoard}>
      <div className={styles.score}>
        <span className={styles.scoreValue}>{score.left}</span>
      </div>
      <div className={styles.divider}>-</div>
      <div className={styles.score}>
        <span className={styles.scoreValue}>{score.right}</span>
      </div>
    </div>
  );
} 