import React from 'react';

function NetworkStatus({ latency, quality }) {
  return (
    <div className="network-status">
      <div className={`status-indicator ${quality}`}>
        <span className="latency">{latency}ms</span>
      </div>
    </div>
  );
}

export default NetworkStatus; 