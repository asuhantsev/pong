import { useState } from 'react';
import '../../styles/OptionsMenu.css';

export function OptionsMenu({ onBack }) {
  const currentNickname = localStorage.getItem('nickname') || 'Guest';
  const [nickname, setNickname] = useState(currentNickname);
  const [error, setError] = useState('');

  const validateNickname = (value) => {
    if (!value.trim()) {
      return 'Nickname is required';
    }
    if (value.length < 3) {
      return 'Nickname must be at least 3 characters';
    }
    if (value.length > 15) {
      return 'Nickname must be less than 15 characters';
    }
    return '';
  };

  const handleSave = () => {
    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }
    localStorage.setItem('nickname', nickname);
    onBack();
  };

  return (
    <div className="options-menu">
      <h2>Options</h2>
      
      <div className="nickname-section">
        <label htmlFor="nickname">Nickname:</label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => {
            setNickname(e.target.value);
            setError('');
          }}
          placeholder="Enter nickname"
          maxLength={15}
        />
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="options-buttons">
        <button 
          className="save-button"
          onClick={handleSave}
          disabled={nickname === currentNickname || !!error}
        >
          Save Changes
        </button>
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
} 