import React from 'react';
import './styles/App.css';
import './styles/GameBoard.css';
import ErrorBoundary from './components/ErrorBoundary';
import GameBoard from './components/GameBoard';

function App() {
  return (
    <ErrorBoundary>
      <GameBoard />
    </ErrorBoundary>
  );
}

export default App;
