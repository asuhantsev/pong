import { layout, buttons, status, overlays, typography, animations } from '../styles/shared';

export function ConnectionError({ error, onRetry, onRecovery }) {
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
          {error.message || 'Connection Error'}
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

        {onRecovery && (
          <button
            onClick={onRecovery}
            className={`
              ${buttons.button}
              ${buttons.secondary}
              ${animations.scaleIn}
            `}
          >
            Try Recovery Mode
          </button>
        )}
      </div>
    </div>
  );
} 