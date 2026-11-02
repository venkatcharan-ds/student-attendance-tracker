// Circular gauge: green arc for present, red arc for absent, track for not marked
function ProgressRing({ present, absent, total, size = 96, stroke = 10, children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const share = (n) => (total === 0 ? 0 : (n / total) * c)
  const presentLen = share(present)
  const absentLen = share(absent)

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-absent"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${absentLen} ${c}`}
          strokeDashoffset={-presentLen}
        />
        <circle
          className="ring-present"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${presentLen} ${c}`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

export default ProgressRing
