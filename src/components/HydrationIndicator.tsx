interface HydrationIndicatorProps {
  hydration: number
  compact?: boolean
}

export function HydrationIndicator({ hydration, compact = false }: HydrationIndicatorProps) {
  const getColor = () => {
    if (hydration < 60) return 'var(--hydration-dry)'
    if (hydration <= 75) return 'var(--hydration-medium)'
    return 'var(--hydration-wet)'
  }

  const getLabel = () => {
    if (hydration < 60) return 'Firme'
    if (hydration <= 75) return 'Media'
    return 'Liquida'
  }

  const color = getColor()
  const percentage = Math.min(hydration, 100)

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div 
          className="w-10 h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-inset)' }}
        >
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${percentage}%`, 
              backgroundColor: color 
            }}
          />
        </div>
        <span 
          className="text-xs font-medium"
          style={{ color }}
        >
          {hydration}%
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Hidratación</span>
        <span 
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ 
            color, 
            backgroundColor: `${color}15` 
          }}
        >
          {hydration}% · {getLabel()}
        </span>
      </div>
      <div 
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--bg-inset)' }}
      >
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color 
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
        <span>50%</span>
        <span>60%</span>
        <span>70%</span>
        <span>80%</span>
        <span>90%</span>
      </div>
    </div>
  )
}
