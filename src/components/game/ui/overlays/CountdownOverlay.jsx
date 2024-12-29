import styles from '../../../../styles/components/game/ui/overlays/CountdownOverlay.module.css';
import layoutStyles from '../../../../styles/components/shared/Layout.module.css';
import themeStyles from '../../../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../../../styles/components/shared/Typography.module.css';
import animationStyles from '../../../../styles/components/shared/Animation.module.css';

export function CountdownOverlay({ count }) {
  if (count === null) return null;

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
        ${animationStyles.scaleIn}
      `}>
        <div className={`
          ${typographyStyles.heading1}
          ${styles.countdown}
          ${animationStyles.bounce}
        `}>
          {count}
        </div>
      </div>
    </div>
  );
} 