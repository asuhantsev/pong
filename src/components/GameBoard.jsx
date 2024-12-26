import { useState, useEffect, useRef } from 'react'
import '../styles/GameElements.css'
import Paddle from './Paddle'
import Ball from './Ball'

function GameBoard() {
  // State for paddle positions
  const [leftPaddlePos, setLeftPaddlePos] = useState(250)
  const [rightPaddlePos, setRightPaddlePos] = useState(250)
  
  // State to track which keys are currently pressed
  const [keysPressed, setKeysPressed] = useState(new Set())
  
  // Add ball state
  const [ballPos, setBallPos] = useState({
    x: 400, // Center of board (800/2)
    y: 300  // Center of board (600/2)
  })

  // Constants for paddle movement
  const PADDLE_SPEED = 10
  const PADDLE_BOUNDARY = {
    top: 0,
    bottom: 500
  }
  const BALL_SIZE = 15
  const BOARD_WIDTH = 800
  const BOARD_HEIGHT = 600

  // Add paddle constants
  const PADDLE_WIDTH = 20
  const PADDLE_HEIGHT = 100
  const PADDLE_OFFSET = 20  // Distance from edge of board

  // Add score state
  const [score, setScore] = useState({
    left: 0,
    right: 0
  })

  // Add constants for ball speed
  const BALL_SPEED = {
    x: 3,  // Horizontal speed
    y: 3   // Initial vertical speed
  }

  // Update initial ball velocity state
  const [ballVelocity, setBallVelocity] = useState({
    x: BALL_SPEED.x,
    y: BALL_SPEED.y
  })

  // Add game state
  const [isGameStarted, setIsGameStarted] = useState(false)

  // Add state for scoring delay
  const [isScoreDelay, setIsScoreDelay] = useState(false)

  // Add winning state
  const [winner, setWinner] = useState(null)
  const WINNING_SCORE = 10

  // Add player names state
  const [playerNames, setPlayerNames] = useState({
    left: 'Player 1',
    right: 'Player 2'
  })

  // Add pause state
  const [isPaused, setIsPaused] = useState(false)

  // Add countdown state
  const [countdown, setCountdown] = useState(null)

  // Add ref to store interval ID
  const countdownIntervalRef = useRef(null)

  // Add function to clear countdown
  const clearCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    setCountdown(null)
  }

  // Update input handling to allow spaces
  const handleNameChange = (player, value) => {
    // Only use trim() when checking for empty string
    const trimmedValue = value.trim()
    setPlayerNames(prev => ({
      ...prev,
      [player]: trimmedValue === '' ? `Player ${player === 'left' ? '1' : '2'}` : value
    }))
  }

  // Helper function to reset ball with delay
  const resetBallWithDelay = (direction) => {
    setIsScoreDelay(true)
    
    // Wait for 1 second before resetting ball
    setTimeout(() => {
      setBallPos({
        x: BOARD_WIDTH / 2,
        y: BOARD_HEIGHT / 2
      })
      setBallVelocity({
        x: direction * BALL_SPEED.x,
        y: Math.random() * BALL_SPEED.y * 2 - BALL_SPEED.y
      })
      setIsScoreDelay(false)
    }, 1000)
  }

  // Update paddle collision handler
  const checkPaddleCollision = (ballX, ballY) => {
    // Left paddle collision
    if (
      ballX <= PADDLE_OFFSET + PADDLE_WIDTH &&
      ballX >= PADDLE_OFFSET &&
      ballY + BALL_SIZE >= leftPaddlePos &&
      ballY <= leftPaddlePos + PADDLE_HEIGHT
    ) {
      const relativeIntersectY = (leftPaddlePos + (PADDLE_HEIGHT / 2)) - (ballY + (BALL_SIZE / 2))
      const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2)
      const bounceAngle = normalizedIntersectY * 0.75
      
      return {
        x: BALL_SPEED.x,  // Use constant speed
        y: -Math.sin(bounceAngle) * BALL_SPEED.y
      }
    }
    
    // Right paddle collision
    if (
      ballX + BALL_SIZE >= BOARD_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH &&
      ballX + BALL_SIZE <= BOARD_WIDTH - PADDLE_OFFSET &&
      ballY + BALL_SIZE >= rightPaddlePos &&
      ballY <= rightPaddlePos + PADDLE_HEIGHT
    ) {
      const relativeIntersectY = (rightPaddlePos + (PADDLE_HEIGHT / 2)) - (ballY + (BALL_SIZE / 2))
      const normalizedIntersectY = relativeIntersectY / (PADDLE_HEIGHT / 2)
      const bounceAngle = normalizedIntersectY * 0.75
      
      return {
        x: -BALL_SPEED.x,  // Use constant speed
        y: -Math.sin(bounceAngle) * BALL_SPEED.y
      }
    }
    
    return null
  }

  // Update pause change handler
  const handlePauseChange = (shouldPause) => {
    if (shouldPause) {
      clearCountdown()
      setIsPaused(true)
    } else {
      setCountdown(3)
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearCountdown()
            setIsPaused(false)
            return null
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  // Update keyboard event handler
  useEffect(() => {
    const preventDefaultKeys = new Set(['ArrowUp', 'ArrowDown', ' ', 'w', 's'])
    
    function handleKeyDown(e) {
      // Don't prevent default if we're typing in an input
      const isTyping = e.target.tagName.toLowerCase() === 'input'
      
      if (preventDefaultKeys.has(e.key) && !isTyping) {
        e.preventDefault()
        setKeysPressed(prev => new Set([...prev, e.key]))
      }
      
      // Handle ESC key
      if (e.key === 'Escape' && isGameStarted) {
        if (countdown) {
          clearCountdown()
          setIsPaused(true)
        } else {
          handlePauseChange(!isPaused)
        }
      }
    }

    function handleKeyUp(e) {
      setKeysPressed(prev => {
        const newKeys = new Set([...prev])
        newKeys.delete(e.key)
        return newKeys
      })
    }

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isGameStarted, isPaused, countdown])

  // Update paddle movement effect
  useEffect(() => {
    // Don't move paddles if game is paused or counting down
    if (isPaused || countdown) return
    
    let frameId
    
    const updatePaddles = () => {
      keysPressed.forEach(key => {
        switch(key) {
          case 'w':
            setLeftPaddlePos(prev => 
              Math.max(PADDLE_BOUNDARY.top, prev - PADDLE_SPEED)
            )
            break
          case 's':
            setLeftPaddlePos(prev => 
              Math.min(PADDLE_BOUNDARY.bottom, prev + PADDLE_SPEED)
            )
            break
          case 'ArrowUp':
            setRightPaddlePos(prev => 
              Math.max(PADDLE_BOUNDARY.top, prev - PADDLE_SPEED)
            )
            break
          case 'ArrowDown':
            setRightPaddlePos(prev => 
              Math.min(PADDLE_BOUNDARY.bottom, prev + PADDLE_SPEED)
            )
            break
        }
      })

      frameId = requestAnimationFrame(updatePaddles)
    }

    frameId = requestAnimationFrame(updatePaddles)
    return () => cancelAnimationFrame(frameId)
  }, [keysPressed, isPaused, countdown])

  // Update scoring logic to check for winner
  const handleScoring = (scoringPlayer) => {
    setScore(prev => {
      const newScore = {
        ...prev,
        [scoringPlayer]: prev[scoringPlayer] + 1
      }
      
      if (newScore[scoringPlayer] >= WINNING_SCORE) {
        setWinner(playerNames[scoringPlayer])
        setIsGameStarted(false)
        return newScore
      }
      
      resetBallWithDelay(scoringPlayer === 'left' ? -1 : 1)
      return newScore
    })
  }

  // Update game logic useEffect to use handleScoring
  useEffect(() => {
    if (!isGameStarted || isScoreDelay || isPaused) return
    
    let frameId
    const updateGame = () => {
      setBallPos(prevPos => {
        const newPos = {
          x: prevPos.x + ballVelocity.x,
          y: prevPos.y + ballVelocity.y
        }

        // Check paddle collisions
        const newVelocity = checkPaddleCollision(newPos.x, newPos.y)
        if (newVelocity) {
          setBallVelocity(newVelocity)
        }

        // Handle wall collisions
        if (newPos.y <= 0) {
          newPos.y = 0
          setBallVelocity(prev => ({
            ...prev,
            y: Math.abs(prev.y)
          }))
        } else if (newPos.y >= BOARD_HEIGHT - BALL_SIZE) {
          newPos.y = BOARD_HEIGHT - BALL_SIZE
          setBallVelocity(prev => ({
            ...prev,
            y: -Math.abs(prev.y)
          }))
        }

        // Update scoring logic
        if (newPos.x <= 0) {
          handleScoring('right')
          return prevPos
        } else if (newPos.x >= BOARD_WIDTH - BALL_SIZE) {
          handleScoring('left')
          return prevPos
        }

        return newPos
      })

      frameId = requestAnimationFrame(updateGame)
    }

    frameId = requestAnimationFrame(updateGame)
    return () => cancelAnimationFrame(frameId)
  }, [ballVelocity, leftPaddlePos, rightPaddlePos, isGameStarted, isScoreDelay, isPaused])

  // Update handleStartGame to reset winner
  const handleStartGame = () => {
    setBallPos({
      x: BOARD_WIDTH / 2,
      y: BOARD_HEIGHT / 2
    })
    setBallVelocity({
      x: BALL_SPEED.x,
      y: BALL_SPEED.y
    })
    setScore({ left: 0, right: 0 })
    setWinner(null)
    setIsGameStarted(true)
  }

  // Add handler for back button
  const handleBackToTitle = () => {
    setWinner(null)
  }

  // Update resume handler to use handlePauseChange
  const handleResume = () => {
    handlePauseChange(false)
  }

  // Update exit handler
  const handleExit = () => {
    clearCountdown()
    setIsPaused(false)
    setIsGameStarted(false)
    setScore({ left: 0, right: 0 })
    setBallPos({
      x: BOARD_WIDTH / 2,
      y: BOARD_HEIGHT / 2
    })
    setBallVelocity({
      x: BALL_SPEED.x,
      y: BALL_SPEED.y
    })
  }

  // Update click handler for pause menu
  const handlePauseMenuClick = (e) => {
    // Prevent click from propagating to game board
    e.stopPropagation()
    
    if (countdown) {
      // If counting down and clicked within pause menu, cancel countdown
      clearCountdown()
      setIsPaused(true)
    }
  }

  return (
    <div className="game-container">
      {isGameStarted ? (
        <>
          <div className="score-board">
            <div className="player-score">
              <div className="player-name">{playerNames.left}</div>
              <div className="score">{score.left}</div>
            </div>
            <div className="player-score">
              <div className="player-name">{playerNames.right}</div>
              <div className="score">{score.right}</div>
            </div>
          </div>
          <div className="game-board">
            <Paddle position="left" top={leftPaddlePos} />
            <Paddle position="right" top={rightPaddlePos} />
            <Ball position={ballPos} />
            {(isPaused || countdown) && (
              <div className="pause-overlay">
                <div 
                  className="pause-menu"
                  onClick={handlePauseMenuClick}
                >
                  {countdown ? (
                    <div className="countdown">{countdown}</div>
                  ) : (
                    <>
                      <h2>Game Paused</h2>
                      <div className="button-group">
                        <button className="start-button" onClick={handleResume}>
                          Resume
                        </button>
                        <button className="back-button" onClick={handleExit}>
                          Exit
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="start-menu">
          {winner ? (
            <>
              <h2>{winner} wins! 🎉</h2>
              <div className="button-group">
                <button className="start-button" onClick={handleStartGame}>
                  Play Again
                </button>
                <button className="back-button" onClick={handleBackToTitle}>
                  Back
                </button>
              </div>
            </>
          ) : (
            <>
              <h2>Welcome to Pong!</h2>
              <div className="player-inputs">
                <div className="input-group">
                  <label htmlFor="player1">Left Player:</label>
                  <input
                    id="player1"
                    type="text"
                    value={playerNames.left}
                    onChange={(e) => handleNameChange('left', e.target.value)}
                    maxLength={12}
                    placeholder="Player 1"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="player2">Right Player:</label>
                  <input
                    id="player2"
                    type="text"
                    value={playerNames.right}
                    onChange={(e) => handleNameChange('right', e.target.value)}
                    maxLength={12}
                    placeholder="Player 2"
                  />
                </div>
              </div>
              <button className="start-button" onClick={handleStartGame}>
                Start Game
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default GameBoard 