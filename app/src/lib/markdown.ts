import { marked } from 'marked'
import katex from 'katex'
import DOMPurify from 'dompurify'
import 'katex/dist/katex.min.css'

marked.setOptions({ breaks: true })

function renderMath(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr, { displayMode, throwOnError: false, output: 'html' })
  } catch {
    return expr
  }
}

/**
 * Render a string containing light markdown plus KaTeX math ($...$ inline,
 * $$...$$ display) to sanitized HTML. Math is extracted first so markdown
 * processing can't mangle it, then re-inserted.
 */
export function renderRich(src: string): string {
  if (!src) return ''
  const math: string[] = []

  let s = src.replace(/\$\$([\s\S]+?)\$\$/g, (_m, e: string) => {
    math.push(renderMath(e.trim(), true))
    return `@@MATH${math.length - 1}@@`
  })
  s = s.replace(/\$([^$\n]+?)\$/g, (_m, e: string) => {
    math.push(renderMath(e.trim(), false))
    return `@@MATH${math.length - 1}@@`
  })

  let html = marked.parse(s, { async: false }) as string
  html = html.replace(/@@MATH(\d+)@@/g, (_m, i: string) => math[Number(i)] ?? '')

  return DOMPurify.sanitize(html)
}
