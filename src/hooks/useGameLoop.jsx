import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from '../store/store';
import { physicsActions } from '../store/actions';
import Logger from '../utils/logger';

export function useGameLoop({ isActive, onTick }) {
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isCleanedUpRef = useRef(false);
  const dispatch = useDispatch();
  
  // Memoize selectors to prevent unnecessary re-renders
  const mode = useSelector(state => state.game.mode);
  const ball = useSelector(state => state.physics.ball);
  const rightPaddle = useSelector(state => state.physics.paddles?.right);

  // Reset cleanup flag on mount
  useEffect(() => {
    isCleanedUpRef.current = false;
    return () => {
      isCleanedUpRef.current = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || isCleanedUpRef.current) {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
      lastTimeRef.current = 0;
      return;
    }

    const gameLoop = (timestamp) => {
      // Don't continue if we're cleaning up or not active
      if (isCleanedUpRef.current || !isActive) {
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      
      // Only update if enough time has passed
      if (deltaTime >= 16) { // ~60fps
        lastTimeRef.current = timestamp;
        
        try {
          onTick(deltaTime);
        } catch (error) {
          Logger.error('GameLoop', 'Error in game loop', error);
          isCleanedUpRef.current = true;
          return;
        }
      }

      // Schedule next frame only if still active
      if (!isCleanedUpRef.current && isActive) {
        frameRef.current = requestAnimationFrame(gameLoop);
      }
    };

    // Start the game loop
    frameRef.current = requestAnimationFrame(gameLoop);

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [isActive, onTick]); // Only depend on isActive and onTick
} 