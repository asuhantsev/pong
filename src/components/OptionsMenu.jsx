import { useState, useMemo } from 'react';
import { NICKNAME_RULES, NICKNAME_ERRORS } from '../constants/gameConstants';
import { SoundEffects } from '../utils/SoundEffects';
import '../styles/OptionsMenu.css';

const isValidNickname = (nickname) => {
  if (!nickname) return false;
  if (nickname.length < NICKNAME_RULES.MIN_LENGTH) return false;
  if (nickname.length > NICKNAME_RULES.MAX_LENGTH) return false;
  return NICKNAME_RULES.PATTERN.test(nickname);
};

const getNicknameError = (nickname) => {
  if (!nickname) return NICKNAME_ERRORS.REQUIRED;
  if (nickname.length < NICKNAME_RULES.MIN_LENGTH) return NICKNAME_ERRORS.TOO_SHORT;
  if (nickname.length > NICKNAME_RULES.MAX_LENGTH) return NICKNAME_ERRORS.TOO_LONG;
  if (!NICKNAME_RULES.PATTERN.test(nickname)) return NICKNAME_ERRORS.INVALID_CHARS;
  return '';
};

function OptionsMenu({ currentNickname, onNicknameChange, onBack }) {
  const [nickname, setNickname] = useState(currentNickname);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const sounds = useMemo(() => SoundEffects.createMenuSounds(), []);

  const handleSave = () => {
    if (!isValidNickname(nickname)) {
      const errorMessage = getNicknameError(nickname);
      setError(errorMessage);
      sounds.error.play();
      return;
    }

    setSaveStatus('saving');
    try {
      onNicknameChange(nickname);
      setSaveStatus('saved');
      sounds.success.play();
      setError('');
    } catch (err) {
      setSaveStatus('error');
      setError('Failed to save nickname');
      sounds.error.play();
    }
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
            setSaveStatus('idle');
          }}
          maxLength={NICKNAME_RULES.MAX_LENGTH}
          placeholder="Enter nickname"
        />
        {error && <div className="error-message">{error}</div>}
      </div>
      <div className="options-buttons">
        <button 
          className={`save-button ${saveStatus}`}
          onClick={handleSave}
          disabled={saveStatus === 'saving' || nickname === currentNickname}
        >
          {saveStatus === 'saved' ? '✓ Saved' : 'Save'}
        </button>
        <button className="back-button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
}

export default OptionsMenu; 