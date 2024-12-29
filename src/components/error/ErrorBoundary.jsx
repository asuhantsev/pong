import React from 'react';
import styles from '../../styles/components/error/ErrorBoundary.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import themeStyles from '../../styles/components/shared/Theme.module.css';
import typographyStyles from '../../styles/components/shared/Typography.module.css';
import buttonStyles from '../../styles/components/shared/Button.module.css';
import spacingStyles from '../../styles/components/shared/Spacing.module.css';
import animationStyles from '../../styles/components/shared/Animation.module.css';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={`
          ${layoutStyles.flexColumn}
          ${layoutStyles.itemsCenter}
          ${layoutStyles.justifyCenter}
          ${layoutStyles.fullHeight}
          ${animationStyles.fadeIn}
        `}>
          <div className={`
            ${styles.errorContainer}
            ${themeStyles.glass}
            ${spacingStyles.p6}
            ${layoutStyles.flexColumn}
            ${layoutStyles.itemsCenter}
            ${spacingStyles.gap4}
          `}>
            <div className={`
              ${styles.errorIcon}
              ${animationStyles.scaleIn}
            `}>
              ⚠️
            </div>

            <h2 className={`
              ${typographyStyles.heading2}
              ${styles.errorTitle}
              ${spacingStyles.mb2}
            `}>
              Oops! Something went wrong
            </h2>

            <p className={`
              ${typographyStyles.text}
              ${styles.errorMessage}
              ${spacingStyles.mb4}
            `}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            <div className={`
              ${styles.errorDetails}
              ${spacingStyles.mb4}
            `}>
              <pre className={typographyStyles.mono}>
                {this.state.error?.stack?.split('\n').slice(0, 3).join('\n')}
              </pre>
            </div>

            <button
              onClick={this.handleReload}
              className={`
                ${buttonStyles.large}
                ${styles.reloadButton}
                ${animationStyles.scaleIn}
              `}
            >
              Reload Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 