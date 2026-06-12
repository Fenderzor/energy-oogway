import { useEffect, useState } from 'react'
import Page from '../components/Page'
import { getThemeMode, setThemeMode } from '../lib/theme'
import type { ThemeMode } from '../lib/theme'
import { getStats, setDailyGoal } from '../lib/stats'
import type { Stats } from '../lib/stats'
import { currentUserId } from '../lib/user'

const modes: ThemeMode[] = ['system', 'light', 'dark']
const goals = [10, 20, 30, 50]

export default function Settings() {
  const userId = currentUserId()
  const [mode, setMode] = useState<ThemeMode>(getThemeMode())
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    void getStats(userId).then(setStats)
  }, [userId])

  const changeTheme = (m: ThemeMode) => {
    setMode(m)
    setThemeMode(m)
  }
  const changeGoal = (g: number) => {
    void setDailyGoal(userId, g).then(setStats)
  }

  return (
    <Page title="Settings">
      <section className="card">
        <h3 className="setting-title">Appearance</h3>
        <div className="segmented" role="group" aria-label="Theme">
          {modes.map((m) => (
            <button
              key={m}
              type="button"
              className={'seg' + (mode === m ? ' seg--active' : '')}
              onClick={() => changeTheme(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3 className="setting-title">Daily goal</h3>
        <div className="segmented" role="group" aria-label="Daily goal">
          {goals.map((g) => (
            <button
              key={g}
              type="button"
              className={'seg' + (stats?.dailyGoal === g ? ' seg--active' : '')}
              onClick={() => changeGoal(g)}
            >
              {g}
            </button>
          ))}
        </div>
        <p className="muted">Cards to review per day.</p>
      </section>

      <section className="card">
        <h3 className="setting-title">Your progress</h3>
        <div className="stat-rows">
          <div className="stat-row">
            <span>🔥 Current streak</span>
            <strong>{stats?.streak ?? 0} days</strong>
          </div>
          <div className="stat-row">
            <span>🏆 Longest streak</span>
            <strong>{stats?.longestStreak ?? 0} days</strong>
          </div>
          <div className="stat-row">
            <span>⚡ Total XP</span>
            <strong>{stats?.xpTotal ?? 0}</strong>
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="setting-title">About</h3>
        <p className="muted">
          Energy Oogway — your daily energy news &amp; thermodynamics study companion. 🐢⚡
        </p>
        <p className="muted">Version 0.3.0 · Phase 3</p>
      </section>
    </Page>
  )
}
