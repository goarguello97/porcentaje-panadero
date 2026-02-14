import { useState, useMemo, useEffect } from 'react'
import type { RecipeWithIngredients, Ingredient } from '../types'
import { HydrationIndicator } from './HydrationIndicator'
import { calculateHydration } from '../utils'

interface IngredientInput {
  id: string
  name: string
  weight: number
  percentage: number
  isFlour: boolean
}

interface RecipeEditorProps {
  recipe?: RecipeWithIngredients
  isSaving?: boolean
  onSave: (name: string, ingredients: Omit<Ingredient, 'id' | 'recipe_id' | 'percentage'>[]) => void
  onBack: () => void
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function RecipeEditor({ recipe, isSaving = false, onSave, onBack }: RecipeEditorProps) {
  const isNewRecipe = !recipe
  
  const [name, setName] = useState(recipe?.name || '')
  const [totalMass, setTotalMass] = useState<number>(0)
  const [isEditingRecipe, setIsEditingRecipe] = useState(isNewRecipe)
  const [originalIngredients, setOriginalIngredients] = useState<IngredientInput[]>([])
  
  const [ingredients, setIngredients] = useState<IngredientInput[]>(() => {
    if (recipe?.ingredients) {
      const flourIngredients = recipe.ingredients.filter(
        i => i.name.toLowerCase().includes('harina') || i.name.toLowerCase().includes('flour')
      )
      const totalFlourWeight = flourIngredients.reduce((sum, i) => sum + i.weight, 0)
      
      if (totalFlourWeight > 0) {
        const totalRecipeWeight = recipe.ingredients.reduce((sum, i) => sum + i.weight, 0)
        setTotalMass(Math.round(totalRecipeWeight))
      }

      const flourPercentage = totalFlourWeight > 0 ? 100 : 0
      
      const result = recipe.ingredients.map((i, idx) => {
        const isFlour = i.name.toLowerCase().includes('harina') || i.name.toLowerCase().includes('flour')
        const percentage = isFlour 
          ? flourPercentage
          : (totalFlourWeight > 0 ? (i.weight / totalFlourWeight) * 100 : 0)
        
        return {
          id: `ing-${idx}-${generateId()}`,
          name: i.name,
          weight: i.weight,
          percentage,
          isFlour
        }
      })
      
      setOriginalIngredients(JSON.parse(JSON.stringify(result)))
      return result
    }
    return [{ id: generateId(), name: 'Harina', weight: 0, percentage: 100, isFlour: true }]
  })

  useEffect(() => {
    if (isEditingRecipe) {
      setOriginalIngredients(JSON.parse(JSON.stringify(ingredients)))
    }
  }, [isEditingRecipe])

  const flourIngredients = useMemo(() => 
    ingredients.filter(i => i.isFlour), 
  [ingredients])

  const totalPercentage = useMemo(() => {
    return ingredients.reduce((sum, i) => sum + i.percentage, 0)
  }, [ingredients])

  const calculatedTotalMass = useMemo(() => {
    return ingredients.reduce((sum, i) => sum + i.weight, 0)
  }, [ingredients])

  const flourWeight = useMemo(() => {
    return flourIngredients.reduce((sum, i) => sum + i.weight, 0)
  }, [flourIngredients])

  const hydration = useMemo(() => {
    const ings = ingredients.map(i => ({ name: i.name, weight: i.weight }))
    return calculateHydration(ings)
  }, [ingredients])

  const recalculateFromTotal = (newTotalMass: number) => {
    if (newTotalMass <= 0 || totalPercentage === 0) return
    const flourWeight = newTotalMass / (totalPercentage / 100)
    
    setIngredients(prev => prev.map(ing => {
      if (ing.isFlour) {
        return { ...ing, weight: Math.round(flourWeight) }
      } else {
        const weight = (flourWeight * ing.percentage) / 100
        return { ...ing, weight: Math.round(weight) }
      }
    }))
  }

  const recalculateFromFlour = (newFlourWeight: number) => {
    if (newFlourWeight <= 0) return
    
    setIngredients(prev => prev.map(ing => {
      if (ing.isFlour) {
        return { ...ing, weight: newFlourWeight }
      } else {
        const weight = (newFlourWeight * ing.percentage) / 100
        return { ...ing, weight: Math.round(weight) }
      }
    }))

    const newTotal = newFlourWeight * (totalPercentage / 100)
    setTotalMass(Math.round(newTotal))
  }

  const recalculateFromPercentage = (index: number, newPercentage: number) => {
    setIngredients(prev => {
      const newIngredients = [...prev]
      newIngredients[index] = { ...newIngredients[index], percentage: newPercentage }
      
      const newTotalPercentage = newIngredients.reduce((sum, i) => sum + i.percentage, 0)
      
      if (totalMass > 0 && newTotalPercentage > 0) {
        const flourWeight = totalMass / (newTotalPercentage / 100)
        
        return newIngredients.map(ing => {
          if (ing.isFlour) {
            return { ...ing, weight: Math.round(flourWeight) }
          } else {
            const weight = (flourWeight * ing.percentage) / 100
            return { ...ing, weight: Math.round(weight) }
          }
        })
      }
      
      return newIngredients
    })
  }

  const handleTotalMassChange = (value: number) => {
    setTotalMass(value)
    if (value > 0 && totalPercentage > 0) {
      recalculateFromTotal(value)
    }
  }

  const handleFlourWeightChange = (value: number) => {
    recalculateFromFlour(value)
  }

  const handlePercentageChange = (index: number, value: number) => {
    if (ingredients[index].isFlour) {
      setIngredients(prev => {
        const newIngredients = [...prev]
        
        newIngredients[index] = { ...newIngredients[index], percentage: value }
        
        const newTotalPercentage = newIngredients.reduce((sum, i) => sum + i.percentage, 0)
        
        if (totalMass > 0 && newTotalPercentage > 0) {
          const flourWeight = totalMass / (newTotalPercentage / 100)
          
          return newIngredients.map((ing) => {
            if (ing.isFlour) {
              return { ...ing, weight: Math.round(flourWeight) }
            } else {
              const weight = (flourWeight * ing.percentage) / 100
              return { ...ing, weight: Math.round(weight) }
            }
          })
        }
        
        return newIngredients
      })
    } else {
      recalculateFromPercentage(index, value)
    }
  }

  const handleNameChange = (index: number, value: string) => {
    const newIngredients = [...ingredients]
    const isFlour = value.toLowerCase().includes('harina') || value.toLowerCase().includes('flour')
    
    if (isFlour && !newIngredients[index].isFlour) {
      newIngredients[index] = { 
        ...newIngredients[index], 
        name: value, 
        isFlour: true,
        percentage: 100,
        weight: 0
      }
      if (totalMass > 0 && totalPercentage > 0) {
        const flourWeight = totalMass / (totalPercentage / 100)
        newIngredients[index].weight = Math.round(flourWeight)
      }
    } else {
      newIngredients[index] = { 
        ...newIngredients[index], 
        name: value, 
        isFlour 
      }
    }
    setIngredients(newIngredients)
  }

  const handleWeightChange = (index: number, value: number) => {
    if (ingredients[index].isFlour) {
      recalculateFromFlour(value)
    } else {
      setIngredients(prev => {
        const newIngredients = [...prev]
        newIngredients[index] = { ...newIngredients[index], weight: value }
        return newIngredients
      })
    }
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { 
      id: generateId(),
      name: '', 
      weight: 0, 
      percentage: 0, 
      isFlour: false 
    }])
  }

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index)
      setIngredients(newIngredients)
      
      if (totalMass > 0) {
        const newTotalPercentage = newIngredients.reduce((sum, i) => sum + i.percentage, 0)
        if (newTotalPercentage > 0) {
          recalculateFromTotal(totalMass)
        }
      }
    }
  }

  const handleCancel = () => {
    setIngredients(JSON.parse(JSON.stringify(originalIngredients)))
    const total = originalIngredients.reduce((sum, i) => sum + i.weight, 0)
    setTotalMass(Math.round(total))
    setIsEditingRecipe(false)
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave(
      name,
      ingredients.map((i, idx) => ({
        name: i.name,
        weight: i.weight,
        order_index: idx
      }))
    )
  }

  const handleSaveAndClose = () => {
    handleSave()
    onBack()
  }

  return (
    <div className="min-h-screen pb-24 relative">
      {isSaving && (
        <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[var(--accent-soft)] border-t-[var(--accent-primary)] rounded-full animate-spin"></div>
            <span className="text-[var(--text-secondary)] font-medium">Guardando...</span>
          </div>
        </div>
      )}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border-default)] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Volver</span>
            </button>
            
            <div className="flex items-center gap-2">
              {isEditingRecipe ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveAndClose}
                    disabled={!name.trim()}
                    className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition-all active:scale-[0.98]"
                  >
                    Guardar
                  </button>
                </>
              ) : !isNewRecipe ? (
                <button
                  onClick={() => setIsEditingRecipe(true)}
                  className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition-all active:scale-[0.98]"
                >
                  Editar Receta
                </button>
              ) : (
                <button
                  onClick={handleSaveAndClose}
                  disabled={!name.trim()}
                  className="bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-[var(--radius-md)] font-medium text-sm transition-all active:scale-[0.98]"
                >
                  Guardar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">
            Nombre de la receta
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Pan sourdough casero"
            disabled={!isEditingRecipe}
            className="w-full px-.5 bg-[3 py-2var(--bg-inset)] border border-transparent rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-surface)] transition-all text-base disabled:opacity-70 disabled:cursor-not-allowed"
          />
        </div>

        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Ingredientes</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isEditingRecipe ? 'Porcentaje panadero (harina = 100%)' : 'Tocá Editar Receta para modificar'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-[var(--accent-soft)] rounded-[var(--radius-md)]">
              <label className="block text-xs font-semibold text-[var(--accent-primary)] mb-2">
                Total de masa
              </label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  value={totalMass || ''}
                  onChange={(e) => handleTotalMassChange(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1 px-2 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all font-mono font-semibold text-sm"
                />
                <span className="text-[var(--text-secondary)] text-sm font-medium">g</span>
              </div>
            </div>
            
            <div className="p-3 bg-[var(--accent-soft)] rounded-[var(--radius-md)]">
              <label className="block text-xs font-semibold text-[var(--accent-primary)] mb-2">
                Harina
              </label>
              <div className="flex gap-1 items-center">
                <input
                  type="number"
                  value={flourWeight || ''}
                  onChange={(e) => handleFlourWeightChange(Number(e.target.value))}
                  placeholder="0"
                  className="flex-1 px-2 py-2 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] transition-all font-mono font-semibold text-sm"
                />
                <span className="text-[var(--text-secondary)] text-sm font-medium">g</span>
              </div>
            </div>
          </div>

          {flourIngredients.length > 0 && totalPercentage > 0 && (
            <div className="mb-4 pb-4 border-b border-[var(--border-default)]">
              <HydrationIndicator hydration={hydration} />
            </div>
          )}

          <div className="space-y-2">
            <div className="flex gap-2 items-center text-xs text-[var(--text-muted)] px-1 pb-2">
              <div className="flex-1">Ingrediente</div>
              <div className="w-20 text-right">Peso (g)</div>
              <div className="w-16 text-right">%</div>
              {isEditingRecipe && <div className="w-8"></div>}
            </div>

            {ingredients.map((ing, index) => (
              <div key={ing.id} className="flex gap-2 items-center">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    placeholder={ing.isFlour ? 'Harina' : 'Ingrediente'}
                    disabled={!isEditingRecipe}
                    className={`w-full px-3 py-2.5 bg-[var(--bg-inset)] border border-transparent rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-surface)] transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed ${ing.isFlour ? 'font-medium' : ''}`}
                  />
                </div>
                <div className="w-20 flex-shrink-0">
                  <input
                    type="number"
                    value={ing.weight || ''}
                    onChange={(e) => handleWeightChange(index, Number(e.target.value))}
                    placeholder="0"
                    disabled={!isEditingRecipe}
                    className={`w-full px-2 py-2.5 bg-[var(--bg-inset)] border border-transparent rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-surface)] transition-all text-sm text-right font-mono disabled:opacity-70 disabled:cursor-not-allowed`}
                  />
                </div>
                <div className="w-16 flex-shrink-0">
                  <input
                    type="number"
                    value={ing.percentage || ''}
                    onChange={(e) => handlePercentageChange(index, Number(e.target.value))}
                    placeholder="0"
                    step="0.1"
                    disabled={!isEditingRecipe}
                    className={`w-full px-2 py-2.5 bg-[var(--bg-inset)] border border-transparent rounded-[var(--radius-md)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] focus:bg-[var(--bg-surface)] transition-all text-sm text-right font-mono disabled:opacity-70 disabled:cursor-not-allowed ${ing.isFlour ? 'font-semibold' : ''}`}
                  />
                </div>
                {isEditingRecipe && (
                  <button
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                    className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--danger)] p-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {isEditingRecipe && (
            <button
              onClick={addIngredient}
              className="mt-3 flex items-center gap-1.5 text-[var(--accent-primary)] hover:text-[var(--accent-hover)] text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar ingrediente
            </button>
          )}

          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--text-secondary)]">Total:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">{totalPercentage.toFixed(1)}%</span>
                <span className="font-semibold text-[var(--accent-primary)] font-mono">
                  {calculatedTotalMass}g
                </span>
              </div>
            </div>
            {totalMass > 0 && Math.abs(calculatedTotalMass - totalMass) > 1 && (
              <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                ⚠️ La masa calculada ({calculatedTotalMass}g) no coincide con el total ({totalMass}g)
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
