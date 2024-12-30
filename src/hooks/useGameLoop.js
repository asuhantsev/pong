import { useEffect, useRef } from 'react';
import Logger from '../utils/logger';

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // Time per frame in ms

export function useGameLoop(callback) {
  const frameIdRef = useRef(null);
  const lastTimeRef = useRef(performance.now());
  const accumulatedTimeRef = useRef(0);

  useEffect(() => {
    const gameLoop = (currentTime) => {
      const deltaTime = currentTime - lastTimeRef.current;
      accumulatedTimeRef.current += deltaTime;

      // Cap the accumulated time to prevent spiral of death
      if (accumulatedTimeRef.current > 1000) {
        accumulatedTimeRef.current = FRAME_TIME;
      }

      // Update game state at fixed time steps
      while (accumulatedTimeRef.current >= FRAME_TIME) {
        callback(FRAME_TIME);
        accumulatedTimeRef.current -= FRAME_TIME;
      }

      lastTimeRef.current = currentTime;
      frameIdRef.current = requestAnimationFrame(gameLoop);
    };

    frameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [callback]);
} 