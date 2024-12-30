import { useEffect, useCallback, useState } from 'react';
import { useDispatch } from '../store/store';
import { physicsActions } from '../store/actions';
import physicsSystem, { PhysicsConstants } from '../physics/PhysicsSystem';
import { featureFlags, FeatureFlags } from '../utils/featureFlags';
import Logger from '../utils/logger';

export function useNewPhysics() {
  const dispatch = useDispatch();
  const [physicsState, setPhysicsState] = useState(physicsSystem.getState());

  // Subscribe to physics system updates
  useEffect(() => {
    const unsubscribe = physicsSystem.subscribe(newState => {
      setPhysicsState(newState);
      
      // Sync with store
      dispatch(physicsActions.updateBallPosition(newState.ball.position));
      dispatch(physicsActions.updateBallVelocity(newState.ball.velocity));
      dispatch(physicsActions.updatePaddlePosition('left', newState.paddles.left.y));
      dispatch(physicsActions.updatePaddlePosition('right', newState.paddles.right.y));
    });

    return () => unsubscribe();
  }, [dispatch]);

  // Update physics system
  const updatePhysics = useCallback((timestamp) => {
    if (!featureFlags.isEnabled(FeatureFlags.USE_NEW_PHYSICS)) return;
    physicsSystem.update(timestamp);
  }, []);

  // Reset physics state
  const resetPhysics = useCallback(() => {
    Logger.info('Physics', 'Resetting physics state');
    physicsSystem.resetState();
  }, []);

  // Set paddle velocity
  const setPaddleVelocity = useCallback((side, velocity) => {
    if (!['left', 'right'].includes(side)) {
      Logger.error('Physics', `Invalid paddle side: ${side}`);
      return;
    }
    physicsSystem.setPaddleVelocity(side, velocity);
  }, []);

  // Convert keyboard input to paddle velocity
  const handlePaddleInput = useCallback((keys) => {
    const PADDLE_SPEED = 300;

    // Left paddle (W/S)
    if (keys.has('w')) {
      setPaddleVelocity('left', -PADDLE_SPEED);
    } else if (keys.has('s')) {
      setPaddleVelocity('left', PADDLE_SPEED);
    } else {
      setPaddleVelocity('left', 0);
    }

    // Right paddle (Arrow keys)
    if (keys.has('ArrowUp')) {
      setPaddleVelocity('right', -PADDLE_SPEED);
    } else if (keys.has('ArrowDown')) {
      setPaddleVelocity('right', PADDLE_SPEED);
    } else {
      setPaddleVelocity('right', 0);
    }
  }, [setPaddleVelocity]);

  return {
    state: physicsState,
    updatePhysics,
    resetPhysics,
    setPaddleVelocity,
    handlePaddleInput,
    constants: PhysicsConstants
  };
} 