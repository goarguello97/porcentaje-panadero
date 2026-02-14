export function calculateHydration(ingredients: { name: string; weight: number }[]): number {
  const totalFlour = ingredients
    .filter(i => i.name.toLowerCase().includes('harina') || i.name.toLowerCase().includes('flour'))
    .reduce((sum, i) => sum + i.weight, 0)

  const totalWater = ingredients
    .filter(i => 
      i.name.toLowerCase().includes('agua') || 
      i.name.toLowerCase().includes('water') ||
      i.name.toLowerCase().includes('leche') ||
      i.name.toLowerCase().includes('milk')
    )
    .reduce((sum, i) => sum + i.weight, 0)

  if (totalFlour === 0) return 0
  return Math.round((totalWater / totalFlour) * 100)
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`
  }
  return `${Math.round(grams)}g`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}
