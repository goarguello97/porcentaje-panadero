import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { supabase } from '../lib/supabase'
import type { Ingredient, RecipeWithIngredients } from '../types'

const STORAGE_KEY = 'baker_percentage_recipes'

function getLocalRecipes(): RecipeWithIngredients[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveLocalRecipes(recipes: RecipeWithIngredients[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes))
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState(false)

  useEffect(() => {
    const configured = !!supabase
    setIsSupabaseConfigured(configured)
    loadRecipes()
  }, [])

  const loadRecipes = async () => {
    setLoading(true)
    
    if (supabase) {
      try {
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false })

        if (recipesError) throw recipesError

        if (recipesData && recipesData.length > 0) {
          const { data: ingredientsData, error: ingredientsError } = await supabase
            .from('ingredients')
            .select('*')
            .in('recipe_id', recipesData.map(r => r.id))
            .order('order_index')

          if (ingredientsError) throw ingredientsError

          const recipesWithIngredients: RecipeWithIngredients[] = recipesData.map(recipe => ({
            ...recipe,
            ingredients: ingredientsData?.filter(i => i.recipe_id === recipe.id) || []
          }))
          
          setRecipes(recipesWithIngredients)
          saveLocalRecipes(recipesWithIngredients)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error('Error loading from Supabase, falling back to localStorage:', error)
      }
    }

    setRecipes(getLocalRecipes())
    setLoading(false)
  }

  const calculatePercentages = (ingredients: Omit<Ingredient, 'id' | 'recipe_id' | 'percentage'>[]): Ingredient[] => {
    const totalFlour = ingredients
      .filter(i => i.name.toLowerCase().includes('harina') || i.name.toLowerCase().includes('flour'))
      .reduce((sum, i) => sum + i.weight, 0)

    if (totalFlour === 0) {
      return ingredients.map(i => ({ ...i, percentage: 0, id: uuidv4(), recipe_id: '' }))
    }

    return ingredients.map(i => ({
      ...i,
      percentage: (i.weight / totalFlour) * 100,
      id: uuidv4(),
      recipe_id: ''
    }))
  }

  const createRecipe = useCallback(async (name: string, ingredients: Omit<Ingredient, 'id' | 'recipe_id' | 'percentage'>[]): Promise<RecipeWithIngredients> => {
    setIsSaving(true)
    const recipeId = uuidv4()
    const ingredientsWithPercentage = calculatePercentages(ingredients)
    const finalIngredients = ingredientsWithPercentage.map((i, idx) => ({
      ...i,
      recipe_id: recipeId,
      order_index: idx
    }))

    const newRecipe: RecipeWithIngredients = {
      id: recipeId,
      name,
      created_at: new Date().toISOString(),
      ingredients: finalIngredients
    }

    if (supabase) {
      try {
        const { error: recipeError } = await supabase
          .from('recipes')
          .insert({ id: recipeId, name })

        if (recipeError) throw recipeError

        const { error: ingredientsError } = await supabase
          .from('ingredients')
          .insert(finalIngredients.map(i => ({
            id: i.id,
            recipe_id: i.recipe_id,
            name: i.name,
            weight: i.weight,
            percentage: i.percentage,
            order_index: i.order_index
          })))

        if (ingredientsError) throw ingredientsError
      } catch (error) {
        console.error('Error saving to Supabase:', error)
      }
    }

    setRecipes(prev => {
      const updated = [newRecipe, ...prev]
      saveLocalRecipes(updated)
      return updated
    })

    setIsSaving(false)
    return newRecipe
  }, [])

  const updateRecipe = useCallback(async (recipeId: string, name: string, ingredients: Omit<Ingredient, 'id' | 'recipe_id' | 'percentage'>[]) => {
    setIsSaving(true)
    const ingredientsWithPercentage = calculatePercentages(ingredients)
    const finalIngredients = ingredientsWithPercentage.map((i, idx) => ({
      ...i,
      recipe_id: recipeId,
      order_index: idx
    }))

    const updatedRecipe: RecipeWithIngredients = {
      id: recipeId,
      name,
      created_at: recipes.find(r => r.id === recipeId)?.created_at || new Date().toISOString(),
      ingredients: finalIngredients
    }

    if (supabase) {
      try {
        await supabase.from('recipes').update({ name }).eq('id', recipeId)
        await supabase.from('ingredients').delete().eq('recipe_id', recipeId)
        await supabase.from('ingredients').insert(finalIngredients.map(i => ({
          id: i.id,
          recipe_id: i.recipe_id,
          name: i.name,
          weight: i.weight,
          percentage: i.percentage,
          order_index: i.order_index
        })))
      } catch (error) {
        console.error('Error updating in Supabase:', error)
      }
    }

    setRecipes(prev => {
      const updated = prev.map(r => r.id === recipeId ? updatedRecipe : r)
      saveLocalRecipes(updated)
      return updated
    })
    setIsSaving(false)
  }, [recipes])

  const deleteRecipe = useCallback(async (recipeId: string) => {
    setIsSaving(true)
    if (supabase) {
      try {
        await supabase.from('ingredients').delete().eq('recipe_id', recipeId)
        await supabase.from('recipes').delete().eq('id', recipeId)
      } catch (error) {
        console.error('Error deleting from Supabase:', error)
      }
    }

    setRecipes(prev => {
      const updated = prev.filter(r => r.id !== recipeId)
      saveLocalRecipes(updated)
      return updated
    })
    setIsSaving(false)
  }, [])

  return {
    recipes,
    loading,
    isSaving,
    isSupabaseConfigured,
    createRecipe,
    updateRecipe,
    deleteRecipe
  }
}
