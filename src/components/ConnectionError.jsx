function ConnectionError({ error, onRetry, onExit }) {
  return (
    <div className="pause-overlay">
      <div className="pause-menu">
        <div className="connection-error">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <div className="button-group">
            <button className="start-button" onClick={onRetry}>
              Retry
            </button>
            <button className="back-button" onClick={onExit}>
              Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectionError; 