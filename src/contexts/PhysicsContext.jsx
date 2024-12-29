import { createContext, useContext, useRef, useCallback } from 'react';
import { useGame } from './GameContext';
import { PHYSICS_STEP, BALL_SPEED, SPEED_INCREASE } from '../constants/gameConstants';

const PhysicsContext = createContext(null);

export function PhysicsProvider({ children }) {
  const physicsRef = useRef({
    lastUpdate: 0,
    ballVelocity: { x: 0, y: 0 },
    ballPosition: { x: 0, y: 0 },
    speedMultiplier: 1
  });

  const { state: gameState, actions } = useGame();

  const updatePhysics = useCallback((timestamp) => {
    if (!gameState.isGameStarted || gameState.isPaused) return;

    const delta = timestamp - physicsRef.current.lastUpdate;
    if (delta < PHYSICS_STEP) return;

    // Update ball position
    const newPos = {
      x: physicsRef.current.ballPosition.x + physicsRef.current.ballVelocity.x * delta * physicsRef.current.speedMultiplier,
      y: physicsRef.current.ballPosition.y + physicsRef.current.ballVelocity.y * delta * physicsRef.current.speedMultiplier
    };

    // Handle collisions and scoring
    handleCollisions(newPos);
    checkScoring(newPos);

    physicsRef.current.ballPosition = newPos;
    physicsRef.current.lastUpdate = timestamp;
  }, [gameState.isGameStarted, gameState.isPaused]);

  const resetBall = useCallback(() => {
    physicsRef.current = {
      ...physicsRef.current,
      ballPosition: { x: 0, y: 0 },
      ballVelocity: {
        x: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
        y: BALL_SPEED * (Math.random() * 2 - 1)
      },
      speedMultiplier: 1
    };
  }, []);

  return (
    <PhysicsContext.Provider value={{
      physics: physicsRef.current,
      updatePhysics,
      resetBall
    }}>
      {children}
    </PhysicsContext.Provider>
  );
}

export const usePhysics = () => useContext(PhysicsContext); 