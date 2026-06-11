// Minimal markdown renderer for Jarvis output — headers, bold, lists,
// inline code. No dependency, HUD-styled.
export default function Md({ text = '', size = 13.5 }) {
  const blocks = String(text).split(/\n{2,}/)
  return (
    <div style={{ fontSize: size, lineHeight: 1.62, userSelect: 'text' }}>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}

function Block({ block }) {
  const lines = block.split('\n')

  if (/^#{1,3} /.test(lines[0])) {
    const level = lines[0].match(/^(#+)/)[1].length
    return (
      <>
        <div
          className={level === 1 ? '' : 'label'}
          style={{
            fontFamily: level === 1 ? 'var(--display)' : undefined,
            fontWeight: 600,
            fontSize: level === 1 ? 19 : 11,
            color: 'var(--holo-bright)',
            textShadow: 'var(--glow-sm)',
            margin: '14px 0 6px',
            letterSpacing: level === 1 ? '0.06em' : undefined,
          }}
        >
          {inline(lines[0].replace(/^#+ /, ''))}
        </div>
        {lines.length > 1 && <Block block={lines.slice(1).join('\n')} />}
      </>
    )
  }

  if (lines.every((l) => /^\s*([-*•]|\d+\.)\s/.test(l) || !l.trim())) {
    return (
      <ul style={{ listStyle: 'none', margin: '4px 0 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {lines.filter((l) => l.trim()).map((l, i) => (
          <li key={i} style={{ display: 'flex', gap: 9 }}>
            <span style={{ color: 'var(--holo)', flexShrink: 0, fontSize: 10, marginTop: 3 }}>▸</span>
            <span>{inline(l.replace(/^\s*([-*•]|\d+\.)\s/, ''))}</span>
          </li>
        ))}
      </ul>
    )
  }

  return <p style={{ margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{inline(block)}</p>
}

function inline(text) {
  // split on **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**')) {
      return (
        <strong key={i} style={{ color: 'var(--holo-bright)', fontWeight: 600 }}>
          {p.slice(2, -2)}
        </strong>
      )
    }
    if (p.startsWith('`')) {
      return (
        <code key={i} className="mono" style={{ fontSize: '0.88em', color: 'var(--gold)', background: 'rgba(255,198,110,0.08)', padding: '1px 5px' }}>
          {p.slice(1, -1)}
        </code>
      )
    }
    return p
  })
}
