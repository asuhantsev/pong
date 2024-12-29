import React from 'react';
import styles from '../styles/components/NetworkStatus.module.css';
import layoutStyles from '../styles/components/shared/Layout.module.css';
import themeStyles from '../styles/components/shared/Theme.module.css';
import typographyStyles from '../styles/components/shared/Typography.module.css';
import spacingStyles from '../styles/components/shared/Spacing.module.css';
import animationStyles from '../styles/components/shared/Animation.module.css';

export function NetworkStatus({ latency, jitter, packetLoss }) {
  const getQualityLevel = () => {
    if (latency > 150 || jitter > 50 || packetLoss > 5) return 'poor';
    if (latency > 100 || jitter > 30 || packetLoss > 2) return 'fair';
    return 'good';
  };

  const quality = getQualityLevel();

  return (
    <div className={`
      ${layoutStyles.fixed}
      ${layoutStyles.z20}
      ${styles.container}
      ${animationStyles.fadeIn}
    `}>
      <div className={`
        ${themeStyles.glass}
        ${spacingStyles.p3}
        ${styles[quality]}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${styles.statusCard}
      `}>
        <div className={`
          ${layoutStyles.flexRow}
          ${layoutStyles.justifyBetween}
          ${layoutStyles.itemsCenter}
          ${spacingStyles.gap3}
        `}>
          <div className={styles.statGroup}>
            <div className={typographyStyles.label}>Latency</div>
            <div className={`${typographyStyles.mono} ${styles.statValue}`}>
              {latency}ms
            </div>
          </div>

          <div className={styles.statGroup}>
            <div className={typographyStyles.label}>Jitter</div>
            <div className={`${typographyStyles.mono} ${styles.statValue}`}>
              {jitter}ms
            </div>
          </div>

          <div className={styles.statGroup}>
            <div className={typographyStyles.label}>Loss</div>
            <div className={`${typographyStyles.mono} ${styles.statValue}`}>
              {packetLoss}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkStatus; 