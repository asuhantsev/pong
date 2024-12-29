import React from 'react';
import styles from '../styles/components/ErrorBoundary.module.css';
import layoutStyles from '../styles/components/shared/Layout.module.css';
import buttonStyles from '../styles/components/shared/Button.module.css';
import errorStyles from '../styles/components/shared/ErrorMessage.module.css';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Game Error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={layoutStyles.fullScreen}>
          <div className={layoutStyles.container}>
            <h2 className={styles.heading}>Something went wrong</h2>
            <div className={errorStyles.error}>
              {this.state.error?.message || 'Unknown error occurred'}
            </div>
            <button 
              className={buttonStyles.large}
              onClick={this.handleRestart}
            >
              Restart Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 