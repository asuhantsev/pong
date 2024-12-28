import React, { createContext, useContext, useEffect, useState } from 'react';
import { SoundEffects } from '../utils/SoundEffects';

const SoundContext = createContext(null);

export const SoundProvider = ({ children }) => {
  const [sounds, setSounds] = useState(null);

  useEffect(() => {
    const menuSounds = SoundEffects.createMenuSounds();
    setSounds(menuSounds);

    return () => {
      // Cleanup audio context
      menuSounds.cleanup?.();
    };
  }, []);

  return (
    <SoundContext.Provider value={sounds}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => useContext(SoundContext); 