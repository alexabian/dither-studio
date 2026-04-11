const PANELS = [
  {
    id: 'files',
    label: 'Files  [1]',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3.5A1.5 1.5 0 013.5 2h5.586a1 1 0 01.707.293l3.414 3.414A1 1 0 0113.5 6.414V12.5A1.5 1.5 0 0112 14H3.5A1.5 1.5 0 012 12.5v-9z"/>
        <path d="M9 2v4h4"/>
      </svg>
    ),
  },
  {
    id: 'dither',
    label: 'Dither  [2]',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="3" cy="3" r="1"/><circle cx="8" cy="3" r="1"/><circle cx="13" cy="3" r="1"/>
        <circle cx="5.5" cy="6" r="1"/><circle cx="10.5" cy="6" r="1"/>
        <circle cx="3" cy="9" r="1"/><circle cx="8" cy="9" r="1"/><circle cx="13" cy="9" r="1"/>
        <circle cx="5.5" cy="12" r="1"/><circle cx="10.5" cy="12" r="1"/>
      </svg>
    ),
  },
  {
    id: 'palette',
    label: 'Palette  [3]',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="6"/>
        <circle cx="5.5" cy="5.5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="10.5" cy="5.5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="8" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="5.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="10.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    id: 'adjustments',
    label: 'Adjustments  [4]',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 4h3M9 4h5"/><circle cx="6" cy="4" r="1.5"/>
        <path d="M2 8h7M13 8h1"/><circle cx="11" cy="8" r="1.5"/>
        <path d="M2 12h2M8 12h6"/><circle cx="5" cy="12" r="1.5"/>
      </svg>
    ),
  },
  {
    id: 'presets',
    label: 'Presets  [5]',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5l3.5-.5z"/>
      </svg>
    ),
  },
]

export default function Sidebar({ active, onSelect }) {
  return (
    <nav className="sidebar">
      {PANELS.map(p => (
        <button
          key={p.id}
          className={`sidebar-btn${active === p.id ? ' active' : ''}`}
          onClick={() => onSelect(p.id)}
        >
          {p.icon}
          <span className="sidebar-tooltip">{p.label}</span>
        </button>
      ))}
    </nav>
  )
}
