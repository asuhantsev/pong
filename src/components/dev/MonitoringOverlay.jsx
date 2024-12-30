import { useState, useEffect } from 'react';
import { useFeatureFlags } from '../../contexts/FeatureFlagContext';
import { FeatureFlags } from '../../utils/featureFlags';
import performanceMonitor from '../../utils/performance';
import stateTracker from '../../utils/stateTracker';
import styles from '../../styles/components/dev/MonitoringOverlay.module.css';

export function MonitoringOverlay() {
  const { isEnabled } = useFeatureFlags();
  const [metrics, setMetrics] = useState({});
  const [stateChanges, setStateChanges] = useState([]);
  const [selectedTab, setSelectedTab] = useState('performance');

  // Only show in development and when monitoring is enabled
  if (!isEnabled(FeatureFlags.ENABLE_PERFORMANCE_MONITORING) && 
      !isEnabled(FeatureFlags.ENABLE_DEBUG_OVERLAY)) {
    return null;
  }

  useEffect(() => {
    // Update metrics every second
    const metricsInterval = setInterval(() => {
      if (isEnabled(FeatureFlags.ENABLE_PERFORMANCE_MONITORING)) {
        setMetrics(performanceMonitor.getAllMetrics());
      }
    }, 1000);

    // Subscribe to state changes
    const unsubscribe = stateTracker.subscribe(change => {
      if (isEnabled(FeatureFlags.ENABLE_DEBUG_OVERLAY)) {
        setStateChanges(prev => [...prev.slice(-9), change]);
      }
    });

    return () => {
      clearInterval(metricsInterval);
      unsubscribe();
    };
  }, [isEnabled]);

  const renderPerformanceMetrics = () => (
    <div className={styles.metricsContainer}>
      {Object.entries(metrics).map(([category, categoryMetrics]) => (
        <div key={category} className={styles.category}>
          <h4>{category}</h4>
          {Object.entries(categoryMetrics).map(([name, metric]) => (
            <div key={name} className={styles.metric}>
              <span>{name}:</span>
              <span>
                avg: {metric.avg.toFixed(2)},
                min: {metric.min.toFixed(2)},
                max: {metric.max.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderStateChanges = () => (
    <div className={styles.stateContainer}>
      {stateChanges.map((change, index) => (
        <div key={index} className={styles.stateChange}>
          <div className={styles.stateHeader}>
            <span>{change.component}</span>
            <span>{new Date(change.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className={styles.stateAction}>
            {change.action && <span>Action: {change.action}</span>}
          </div>
          <div className={styles.changes}>
            {Object.entries(change.changes).map(([key, { from, to }]) => (
              <div key={key} className={styles.change}>
                <span>{key}:</span>
                <span className={styles.from}>{JSON.stringify(from)}</span>
                <span>→</span>
                <span className={styles.to}>{JSON.stringify(to)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.tabs}>
        <button
          className={selectedTab === 'performance' ? styles.active : ''}
          onClick={() => setSelectedTab('performance')}
        >
          Performance
        </button>
        <button
          className={selectedTab === 'state' ? styles.active : ''}
          onClick={() => setSelectedTab('state')}
        >
          State Changes
        </button>
      </div>
      <div className={styles.content}>
        {selectedTab === 'performance' ? renderPerformanceMetrics() : renderStateChanges()}
      </div>
    </div>
  );
} 