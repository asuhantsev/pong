import './styles/App.css'
import './styles/GameBoard.css'
import GameBoard from './components/GameBoard'

function App() {
  return (
    <div className="game-container">
      <h1>Pong Game</h1>
      <div className="controls-info">
        <p>Left Paddle: W (up) / S (down)</p>
        <p>Right Paddle: ↑ (up) / ↓ (down)</p>
      </div>
      <GameBoard />
    </div>
  )
}

export default App
