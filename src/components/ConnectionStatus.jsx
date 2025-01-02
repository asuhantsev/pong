import { layout, buttons, status, overlays, typography, animations } from '../styles/shared';

export function ConnectionStatus({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className={`
      ${layout.fixed}
      ${layout.z50}
      ${layout.flexCenter}
      ${layout.fullScreen}
      ${animations.fadeIn}
    `}>
      <div className={`
        ${overlays.dialog}
        ${animations.scaleIn}
      `}>
        <div className={`
          ${status.error}
          ${animations.bounce}
        `}>
          🔌
        </div>

        <h2 className={`
          ${typography.heading2}
          ${status.error}
        `}>
          {error.message || 'Connection Lost'}
        </h2>

        {error.description && (
          <p className={`
            ${typography.text}
            ${status.error}
          `}>
            {error.description}
          </p>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className={`
              ${buttons.button}
              ${buttons.primary}
              ${animations.scaleIn}
            `}
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
} 