import styles from '../../styles/components/shared/Overlay.module.css';

export function CountdownOverlay({ count }) {
  if (!count) return null;
  
  return (
    <div className={styles.countdown}>
      <div className={styles.countdownText}>
        {count}
      </div>
    </div>
  );
} 