import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Today', icon: '📰', end: true },
  { to: '/learn', label: 'Learn', icon: '🧠', end: false },
  { to: '/practice', label: 'Practice', icon: '✍️', end: false },
  { to: '/library', label: 'Library', icon: '📚', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function TabBar() {
  return (
    <nav className="tabbar" aria-label="Primary">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}
        >
          <span className="tab-icon" aria-hidden="true">
            {t.icon}
          </span>
          <span className="tab-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
