// This component represents a single paddle (left or right)
function Paddle({ position, top }) {
  return (
    <div 
      className={`paddle paddle-${position}`} 
      style={{ top: `${top}px` }}
    ></div>
  )
}

export default Paddle 