import { renderRich } from '../lib/markdown'

export default function Rich({ text, className }: { text: string; className?: string }) {
  const cls = className ? `rich ${className}` : 'rich'
  return <div className={cls} dangerouslySetInnerHTML={{ __html: renderRich(text) }} />
}
