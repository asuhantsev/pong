export function PauseOverlay({ onResume }) {
  return (
    <div className="pause-overlay">
      <div className="pause-menu">
        <h2>Game Paused</h2>
        <button 
          className="resume-button"
          onClick={onResume}
        >
          Resume Game
        </button>
      </div>
    </div>
  );
} 