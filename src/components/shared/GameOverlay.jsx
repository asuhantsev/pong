import PropTypes from 'prop-types';
import styles from '../../styles/components/shared/GameOverlay.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import themeStyles from '../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../styles/components/shared/Typography.module.css';
import animationStyles from '../../styles/components/shared/Animation.module.css';

export function GameOverlay({ 
  type,
  children,
  className,
  onClose,
  showCloseButton = false,
  animation = 'fadeIn'
}) {
  return (
    <div className={`
      ${styles.overlay}
      ${styles[type]}
      ${layoutStyles.fixed}
      ${layoutStyles.inset0}
      ${layoutStyles.flexCenter}
      ${themeStyles.glassDark}
      ${animationStyles[animation]}
      ${className}
    `}>
      <div className={`
        ${styles.content}
        ${layoutStyles.flexColumn}
        ${layoutStyles.itemsCenter}
        ${layoutStyles.justifyCenter}
        ${animationStyles.scaleIn}
      `}>
        {children}
        
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className={`
              ${styles.closeButton}
              ${typographyStyles.button}
              ${animationStyles.fadeIn}
            `}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

GameOverlay.propTypes = {
  type: PropTypes.oneOf(['countdown', 'pause', 'winner', 'error']).isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClose: PropTypes.func,
  showCloseButton: PropTypes.bool,
  animation: PropTypes.oneOf(['fadeIn', 'slideIn', 'scaleIn'])
};

GameOverlay.defaultProps = {
  className: '',
  showCloseButton: false,
  animation: 'fadeIn'
}; 