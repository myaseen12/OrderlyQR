'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function loginAction(state: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/admin')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function signupAction(state: any, formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'owner' | 'admin' | 'kitchen_staff'
  const restaurantAction = formData.get('restaurantAction') as 'register' | 'join'
  const restaurantName = formData.get('restaurantName') as string
  const restaurantSlug = formData.get('restaurantSlug') as string

  if (!fullName || !email || !password || !role || !restaurantAction) {
    return { error: 'Please fill in all required fields.' }
  }

  if (restaurantAction === 'register' && (!restaurantName || !restaurantSlug)) {
    return { error: 'Restaurant Name and Slug are required to register a restaurant.' }
  }

  if (restaurantAction === 'join' && !restaurantSlug) {
    return { error: 'Restaurant Slug is required to join a restaurant.' }
  }

  const supabase = await createClient()

  // 1. Sign up the user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  const user = signUpData.user
  if (!user) {
    return { error: 'Failed to create user account. Please try again.' }
  }

  // Note: Local developer flows log in automatically. If confirmation is active,
  // we might need to handle a message. But for high-fidelity preview, let's complete the link.
  
  try {
    let finalRestaurantId = ''
    let assignedRole = role

    if (restaurantAction === 'register') {
      // 2. Create the restaurant
      const { data: newRestaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: restaurantName,
          slug: restaurantSlug.toLowerCase().trim().replace(/\s+/g, '-'),
        })
        .select()
        .single()

      if (restError) {
        return { error: `Restaurant creation failed: ${restError.message}` }
      }
      
      finalRestaurantId = newRestaurant.id
      assignedRole = 'owner' // Registering a restaurant makes you the owner
    } else {
      // 3. Find the existing restaurant by slug
      const { data: existingRestaurant, error: findError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', restaurantSlug.toLowerCase().trim())
        .single()

      if (findError || !existingRestaurant) {
        return { error: 'Restaurant slug not found. Please verify with your owner.' }
      }

      finalRestaurantId = existingRestaurant.id
    }

    // 4. Update the user profile role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: assignedRole, full_name: fullName })
      .eq('id', user.id)

    if (profileError) {
      return { error: `Failed to update profile: ${profileError.message}` }
    }

    // 5. Create membership record
    const { error: memberError } = await supabase
      .from('restaurant_members')
      .insert({
        restaurant_id: finalRestaurantId,
        user_id: user.id,
        role: assignedRole,
      })

    if (memberError) {
      return { error: `Failed to link restaurant membership: ${memberError.message}` }
    }

  } catch (err: any) {
    return { error: err.message || 'An unexpected onboarding error occurred.' }
  }

  redirect('/admin')
}
