import styles from '../../../styles/components/game/PauseOverlay.module.css';

export function PauseOverlay({ onResume, onExit }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <h2>Game Paused</h2>
        <div className={styles.buttons}>
          <button onClick={onResume} className={styles.button}>
            Resume
          </button>
          <button onClick={onExit} className={`${styles.button} ${styles.exitButton}`}>
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
} 