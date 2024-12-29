import '../../styles/OptionsMenu.css';

export function OptionsMenu({ onBack }) {
  return (
    <div className="options-menu">
      <h2>Options</h2>
      <div className="options-buttons">
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
} 