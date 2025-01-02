import { Component } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/components/shared/ErrorBoundary.module.css';
import typographyStyles from '../../styles/components/shared/Typography.module.css';
import layoutStyles from '../../styles/components/shared/Layout.module.css';
import buttonStyles from '../../styles/components/shared/Button.module.css';
import themeStyles from '../../styles/components/shared/Theme.module.css';
import Logger from '../../utils/logger';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    Logger.error('ErrorBoundary', 'Component error caught', {
      error,
      errorInfo,
      componentName: this.props.componentName
    });

    this.setState({
      error,
      errorInfo
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { 
      children, 
      fallback,
      showReset = true,
      resetButtonText = 'Try Again'
    } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleReset);
      }

      // Default error UI
      return (
        <div className={`
          ${styles.errorContainer}
          ${layoutStyles.flexColumn}
          ${layoutStyles.itemsCenter}
          ${layoutStyles.justifyCenter}
          ${themeStyles.glass}
        `}>
          <h2 className={typographyStyles.heading2}>
            Oops! Something went wrong
          </h2>
          
          <p className={`
            ${typographyStyles.body}
            ${styles.errorMessage}
          `}>
            {error?.message || 'An unexpected error occurred'}
          </p>

          {showReset && (
            <button
              onClick={this.handleReset}
              className={`
                ${buttonStyles.button}
                ${styles.resetButton}
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

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  componentName: PropTypes.string,
  fallback: PropTypes.func,
  onError: PropTypes.func,
  onReset: PropTypes.func,
  showReset: PropTypes.bool,
  resetButtonText: PropTypes.string
};

ErrorBoundary.defaultProps = {
  componentName: 'Unknown',
  showReset: true,
  resetButtonText: 'Try Again'
}; 