import type { RecipeWithIngredients } from '../types'
import { HydrationIndicator } from './HydrationIndicator'
import { calculateHydration } from '../utils'

interface RecipeListProps {
  recipes: RecipeWithIngredients[]
  onSelect: (recipe: RecipeWithIngredients) => void
  onDelete: (id: string) => void
  onNew: () => void
}

export function RecipeList({ recipes, onSelect, onDelete, onNew }: RecipeListProps) {
  return (
    <div className="min-h-screen pb-8">
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-default)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                Porcentaje Panadero
              </h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Recetas de panadería
              </p>
            </div>
            <button
              onClick={onNew}
              className="flex items-center gap-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-[var(--radius-md)] font-medium text-sm transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden xs:inline">Nueva</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 mb-4 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Sin recetas aún
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs">
              Crea tu primera receta para empezar a calcular porcentajes panaderos
            </p>
            <button
              onClick={onNew}
              className="mt-4 flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-[var(--radius-md)] font-medium text-sm transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear primera receta
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recipes.map(recipe => {
              const hydration = calculateHydration(recipe.ingredients)
              const flourWeight = recipe.ingredients
                .filter(i => i.name.toLowerCase().includes('harina') || i.name.toLowerCase().includes('flour'))
                .reduce((sum, i) => sum + i.weight, 0)
              
              return (
                <article
                  key={recipe.id}
                  onClick={() => onSelect(recipe)}
                  className="group bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 cursor-pointer transition-all hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)] active:scale-[0.995]"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-[var(--text-primary)] line-clamp-1">
                      {recipe.name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(recipe.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 text-[var(--danger)] hover:bg-[var(--danger)]/10 p-1.5 rounded-[var(--radius-sm)] transition-all"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <HydrationIndicator hydration={hydration} compact />
                    
                    <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        {recipe.ingredients.length} ingred.
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        {flourWeight}g harina
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-[var(--border-default)]">
                    <div className="flex flex-wrap gap-1.5">
                      {recipe.ingredients.slice(0, 4).map((ing, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-[10px] rounded-full"
                        >
                          {ing.name}
                        </span>
                      ))}
                      {recipe.ingredients.length > 4 && (
                        <span className="px-2 py-0.5 text-[var(--text-muted)] text-[10px]">
                          +{recipe.ingredients.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
