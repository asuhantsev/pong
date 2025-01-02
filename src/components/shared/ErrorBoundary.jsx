import { Component } from 'react';
import PropTypes from 'prop-types';
import { layout, buttons, status, overlays, typography, animations } from '../../styles/shared';
import Logger from '../../utils/logger';

export class ErrorBoundary extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.func,
    showReset: PropTypes.bool,
    resetButtonText: PropTypes.string,
    showErrorDetails: PropTypes.bool
  };

  state = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    Logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { 
      children, 
      fallback,
      showReset = true,
      resetButtonText = 'Try Again',
      showErrorDetails = false
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      // Default error UI
      return (
        <div className={`
          ${overlays.dialog}
          ${layout.flexColumn}
          ${layout.itemsCenter}
          ${layout.justifyCenter}
          ${animations.fadeIn}
        `}>
          <div className={`
            ${status.error}
            ${animations.scaleIn}
          `}>
            ⚠️
          </div>

          <h2 className={`
            ${typography.heading2}
            ${status.error}
          `}>
            Oops! Something went wrong
          </h2>
          
          <p className={`
            ${typography.text}
            ${status.error}
          `}>
            {error?.message || 'An unexpected error occurred'}
          </p>

          {showErrorDetails && errorInfo && (
            <div className={overlays.dialog}>
              <pre className={typography.mono}>
                {error?.stack?.split('\n').slice(0, 3).join('\n')}
              </pre>
            </div>
          )}

          {showReset && (
            <button
              onClick={this.handleReset}
              className={`
                ${buttons.button}
                ${buttons.primary}
                ${animations.scaleIn}
              `}
            >
              {resetButtonText}
            </button>
          )}
        </div>
      );
    }

    return children;
  }
} 