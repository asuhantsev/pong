import styles from '../../styles/components/shared/Overlay.module.css';

export function PauseOverlay({ onResume }) {
  return (
    <div className={styles.pause}>
      <div className={styles.content}>
        <h2>Game Paused</h2>
        <button onClick={onResume}>Resume</button>
      </div>
    </div>
  );
} 