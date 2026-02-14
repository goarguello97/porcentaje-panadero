import { useState } from 'react'
import { useRecipes } from './hooks/useRecipes'
import { RecipeList } from './components/RecipeList'
import { RecipeEditor } from './components/RecipeEditor'
import type { RecipeWithIngredients } from './types'

type View = 'list' | 'edit' | 'new'

function App() {
  const { recipes, loading, isSaving, isSupabaseConfigured, createRecipe, updateRecipe, deleteRecipe } = useRecipes()
  const [view, setView] = useState<View>('list')
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | undefined>()

  const handleNew = () => {
    setSelectedRecipe(undefined)
    setView('new')
  }

  const handleSelect = (recipe: RecipeWithIngredients) => {
    setSelectedRecipe(recipe)
    setView('edit')
  }

  const handleBack = () => {
    setView('list')
    setSelectedRecipe(undefined)
  }

  const handleSave = async (name: string, ingredients: { name: string; weight: number; order_index: number }[]) => {
    if (selectedRecipe) {
      await updateRecipe(selectedRecipe.id, name, ingredients)
    } else {
      await createRecipe(name, ingredients)
    }
    handleBack()
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta receta?')) {
      await deleteRecipe(id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {!isSupabaseConfigured && view === 'list' && recipes.length > 0 && (
        <div className="max-w-2xl mx-auto pt-4 px-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-[var(--radius-md)] p-3 text-sm text-yellow-800">
            ⚠️ Supabase no configurado. Los datos se guardan solo en este navegador.
          </div>
        </div>
      )}

      {view === 'list' && (
        <RecipeList
          recipes={recipes}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onNew={handleNew}
        />
      )}

      {(view === 'new' || view === 'edit') && (
        <RecipeEditor
          recipe={selectedRecipe}
          isSaving={isSaving}
          onSave={handleSave}
          onBack={handleBack}
        />
      )}
    </div>
  )
}

export default App
