import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { FeatureFlags } from '../../utils/featureFlags';
import styles from '../../styles/components/dev/FeatureFlagPanel.module.css';

export function FeatureFlagPanel() {
  const { flags, setFlag, resetFlags } = useFeatureFlags();

  // Only render in development mode
  if (import.meta.env.VITE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>Feature Flags</h3>
        <button onClick={resetFlags} className={styles.resetButton}>
          Reset All
        </button>
      </div>
      <div className={styles.flagList}>
        {Object.values(FeatureFlags).map(flag => (
          <label key={flag} className={styles.flagItem}>
            <input
              type="checkbox"
              checked={flags[flag]}
              onChange={e => setFlag(flag, e.target.checked)}
            />
            <span>{flag}</span>
          </label>
        ))}
      </div>
    </div>
  );
} 