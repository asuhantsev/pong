import React from 'react';
import '../styles/ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Game Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-screen">
          <h2>Something went wrong</h2>
          <button onClick={() => window.location.reload()}>
            Restart Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 