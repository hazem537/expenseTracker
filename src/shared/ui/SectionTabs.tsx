import { cn } from '@/lib/utils'

export function SectionTabs<T extends string>({
  value,
  items,
  onChange,
}: {
  value: T
  items: { id: T; label: string }[]
  onChange: (id: T) => void
}) {
  return (
    <div
      className="grid gap-1 rounded-xl border border-gold-soft/70 bg-surface p-1"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            'min-h-11 rounded-lg px-1 text-xs font-semibold sm:px-2 sm:text-sm',
            value === item.id ? 'bg-navy text-gold-bright' : 'text-heading',
          )}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
