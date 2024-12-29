import { useEffect, useRef } from 'react';

const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;

export function useGameLoop(callback) {
  const frameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const gameLoop = (currentTime) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - lastTimeRef.current;

      if (deltaTime >= FRAME_TIME) {
        callbackRef.current(deltaTime / 1000); // Convert to seconds
        lastTimeRef.current = currentTime;
      }

      frameRef.current = requestAnimationFrame(gameLoop);
    };

    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);
} 