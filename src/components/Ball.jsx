import '../styles/GameElements.css'

function Ball({ position }) {
  return (
    <div 
      className="ball"
      style={{
        left: position.x,
        top: position.y,
        width: 15,
        height: 15,
        borderRadius: 0
      }}
    />
  )
}

export default Ball 