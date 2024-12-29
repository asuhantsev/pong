import styles from '../../../../styles/components/game/ui/overlays/PauseOverlay.module.css';
import layoutStyles from '../../../../styles/components/shared/Layout.module.css';
import themeStyles from '../../../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../../../styles/components/shared/Button.module.css';
import spacingStyles from '../../../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../../../styles/components/shared/Animation.module.css';

export function PauseOverlay({ onResume }) {
  return (
    <div className={`
      ${layoutStyles.fixed}
      ${layoutStyles.inset0}
      ${layoutStyles.flexColumn}
      ${layoutStyles.justifyCenter}
      ${layoutStyles.itemsCenter}
      ${themeStyles.glassDark}
      ${animationStyles.fadeIn}
      ${styles.overlay}
    `}>
      <div className={`
        ${styles.content}
        ${themeStyles.glass}
        ${spacingStyles.p6}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${layoutStyles.gap4}
        ${animationStyles.scaleIn}
      `}>
        <h2 className={`
          ${typographyStyles.heading2}
          ${spacingStyles.mb3}
        `}>
          Game Paused
        </h2>
        
        <button
          onClick={onResume}
          className={`
            ${buttonStyles.large}
            ${themeStyles.glass}
            ${styles.resumeButton}
          `}
        >
          Resume Game
        </button>
      </div>
    </div>
  );
} 