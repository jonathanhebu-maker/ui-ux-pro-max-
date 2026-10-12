export default function QtyPicker({
  value,
  onChange,
  min = 1,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
}) {
  return (
    <span className="qty">
      <button type="button" aria-label="הפחתת כמות" onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </button>
      <b aria-live="polite">{value}</b>
      <button type="button" aria-label="הוספת כמות" onClick={() => onChange(value + 1)}>
        +
      </button>
    </span>
  )
}
