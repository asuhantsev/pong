import './styles/App.css'
import './styles/GameBoard.css'
import GameBoard from './components/GameBoard'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <GameBoard />
    </ErrorBoundary>
  )
}

export default App
