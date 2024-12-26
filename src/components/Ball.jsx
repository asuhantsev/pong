// This is our bouncing ball component
function Ball({ position }) {
  return (
    <div 
      className="ball"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`
      }}
    ></div>
  )
}

export default Ball 