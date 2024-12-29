import { useNetwork } from '../../../contexts/NetworkContext';

export function NetworkStatus() {
  const { networkState } = useNetwork();
  const { latency, quality } = networkState;

  return (
    <div className="network-status">
      <div className={`status-indicator ${quality}`}>
        <span className="latency">{latency}ms</span>
        <span className="quality-label">{quality}</span>
      </div>
    </div>
  );
} 