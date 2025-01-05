import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { MainMenu } from './components/menu/MainMenu';
import { GameBoard } from './components/GameBoard';
import { MultiplayerMenu } from './components/menu/MultiplayerMenu';
import { OptionsMenu } from './components/menu/OptionsMenu';

export function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider>
          <Router basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route path="/" element={<MainMenu />} />
              <Route path="/multiplayer" element={<MultiplayerMenu />} />
              <Route path="/options" element={<OptionsMenu />} />
              <Route path="/game" element={<GameBoard />} />
              <Route path="/game/:roomId" element={<GameBoard />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  );
}
