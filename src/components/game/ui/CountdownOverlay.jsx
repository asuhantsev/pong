export function CountdownOverlay({ count }) {
  if (!count) return null;

  return (
    <div className="countdown-overlay">
      <div className="countdown">
        {count}
      </div>
    </div>
  );
} 