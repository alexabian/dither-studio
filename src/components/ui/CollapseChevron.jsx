export default function CollapseChevron({ open }) {
  return (
    <svg
      className="collapse-chevron"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }}
    >
      <path d="M2 3.5l3 3 3-3"/>
    </svg>
  )
}
