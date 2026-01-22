export function SunsetBackground() {
  return (
    <div className="sunset-background-container" aria-hidden="true">
      {/* Main gradient orb - sunset glow at the bottom */}
      <div className="sunset-background-orb sunset-background-orb-primary" />

      {/* Secondary subtle orb for depth */}
      <div className="sunset-background-orb sunset-background-orb-secondary" />

      {/* Ambient glow layer */}
      <div className="sunset-background-ambient" />
    </div>
  )
}

export default SunsetBackground
