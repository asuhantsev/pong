function ConnectionError({ error, onRetry, onExit }) {
  return (
    <div className="pause-overlay">
      <div className="pause-menu">
        <div className="connection-error">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div className="error-buttons">
            {error.includes('rematch') ? (
              <>
                <button onClick={() => onRetry(true)}>Accept Rematch</button>
                <button onClick={() => onRetry(false)}>Decline</button>
              </>
            ) : (
              <button onClick={onRetry}>Retry Connection</button>
            )}
            {error.includes('left the game') ? (
              <button onClick={onExit}>Back to Menu</button>
            ) : (
              <button onClick={onExit}>Exit to Menu</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectionError; 