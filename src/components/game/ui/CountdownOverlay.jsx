import styles from '../../../styles/components/game/CountdownOverlay.module.css';

export function CountdownOverlay({ count }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <div className={styles.number}>{count}</div>
        <div className={styles.text}>Game starting in...</div>
      </div>
    </div>
  );
} 