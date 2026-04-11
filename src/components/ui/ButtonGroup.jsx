export default function ButtonGroup({ options, value, onChange }) {
  return (
    <div className="btn-group">
      {options.map(opt => (
        <button
          key={opt.value}
          className={`btn-chip${value === opt.value ? ' active' : ''}`}
          onClick={() => onChange(opt.value)}
          title={opt.label}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
