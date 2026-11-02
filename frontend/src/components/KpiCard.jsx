import { TrendingDown, TrendingUp } from 'lucide-react'
import AnimatedNumber from './ui/AnimatedNumber.jsx'
import { Skeleton } from './ui/Primitives.jsx'

/**
 * Metric card. `delta` (number) renders a trend arrow; `deltaGood` says whether
 * a positive delta is good news (true for present, false for absent).
 */
function KpiCard({ label, value, suffix = '', icon: Icon, tone, foot, delta, deltaGood = true, loading }) {
  const hasDelta = typeof delta === 'number' && delta !== 0
  const good = hasDelta && (delta > 0) === deltaGood
  return (
    <article className="card kpi" aria-busy={loading}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-icon ${tone ?? ''}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="kpi-value">
        {loading ? <Skeleton width={64} height={28} /> : value === null ? '—' : <AnimatedNumber value={value} suffix={suffix} />}
      </div>
      <div className="kpi-foot">
        {loading ? (
          <Skeleton width={120} height={10} />
        ) : (
          <>
            {hasDelta && (
              <span className={`trend ${good ? 'up' : 'down'}`}>
                {delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {delta > 0 ? '+' : ''}
                {delta}
                {suffix}
              </span>
            )}
            <span>{foot}</span>
          </>
        )}
      </div>
    </article>
  )
}

export default KpiCard
