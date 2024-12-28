const AudioContext = window.AudioContext || window.webkitAudioContext;

export const SoundEffects = {
  createMenuSounds: () => {
    const ctx = new AudioContext();
    
    const createTone = (frequency, duration, type = 'sine') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      
      return {
        play: () => {
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          osc.stop(ctx.currentTime + duration);
        }
      };
    };

    return {
      success: createTone(880, 0.3), // High pitch for success
      error: createTone(220, 0.3, 'square'), // Low pitch for error
    };
  }
}; 