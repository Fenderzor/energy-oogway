import { useEffect, useState } from 'react'
import { getStats, todayView } from '../lib/stats'
import type { Stats } from '../lib/stats'
import { currentUserId } from '../lib/user'

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    void getStats(currentUserId()).then(setStats)
  }, [])

  if (!stats) return null

  const { xpToday, reviewedToday } = todayView(stats)
  const pct = Math.min(100, Math.round((reviewedToday / stats.dailyGoal) * 100))

  return (
    <div className="statsbar card">
      <div className="stat">
        <span className="stat-icon" aria-hidden="true">
          🔥
        </span>
        <span className="stat-val">{stats.streak}</span>
        <span className="stat-lbl">day streak</span>
      </div>

      <div className="stat-goal">
        <div className="goal-head">
          <span>Daily goal</span>
          <span>
            {reviewedToday}/{stats.dailyGoal}
          </span>
        </div>
        <div className="goal-bar">
          <div className="goal-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="stat">
        <span className="stat-icon" aria-hidden="true">
          ⚡
        </span>
        <span className="stat-val">{xpToday}</span>
        <span className="stat-lbl">XP today</span>
      </div>
    </div>
  )
}
