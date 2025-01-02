import styles from '../../../../styles/components/game/ui/overlays/PauseOverlay.module.css';
import { layout, theme, typography, buttons, spacing, animations } from '../../../../styles/shared';

export function PauseOverlay({ onResume, onExit }) {
  return (
    <div className={`
      ${layout.fixed}
      ${layout.inset0}
      ${layout.flexColumn}
      ${layout.justifyCenter}
      ${layout.itemsCenter}
      ${theme.glassDark}
      ${animations.fadeIn}
      ${styles.overlay}
    `}>
      <div className={`
        ${styles.content}
        ${theme.glass}
        ${spacing.p6}
        ${layout.flexColumn}
        ${layout.itemsCenter}
        ${layout.gap4}
        ${animations.scaleIn}
      `}>
        <h2 className={`
          ${typography.heading2}
          ${spacing.mb3}
        `}>
          Game Paused
        </h2>
        
        <div className={`${layout.flexColumn} ${layout.gap3}`}>
          <button
            onClick={onResume}
            className={`${buttons.primaryLarge} ${theme.glass}`}
          >
            Resume Game
          </button>
          
          <button
            onClick={onExit}
            className={`${buttons.secondaryLarge} ${theme.glass}`}
          >
            Exit to Menu
          </button>
        </div>
      </div>
    </div>
  );
} 