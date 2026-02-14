export interface Recipe {
  id: string
  name: string
  created_at: string
}

export interface Ingredient {
  id: string
  recipe_id: string
  name: string
  weight: number
  percentage: number
  order_index: number
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[]
}
