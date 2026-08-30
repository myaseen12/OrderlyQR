'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string
  logo: string
  whatsapp_number: string
}

interface Member {
  role: 'owner' | 'admin' | 'kitchen_staff'
  restaurant_id: string
}

interface AdminContextType {
  user: any | null
  member: Member | null
  restaurant: Restaurant | null
  loading: boolean
  refreshRestaurant: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children, initialUser }: { children: React.ReactNode, initialUser?: any }) {
  const [user, setUser] = useState<any | null>(initialUser || null)
  const [member, setMember] = useState<Member | null>(null)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(!initialUser)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const fetchOnboardingData = useCallback(async (userId: string) => {
    // Fail-safe mock onboarding data for Sandbox Mode
    const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-supabase-project-id')
    if (isMock) {
      setMember({
        role: 'owner',
        restaurant_id: 'bistro-rustique-id',
      })
      setRestaurant({
        id: 'bistro-rustique-id',
        name: 'Bistro Rustique',
        slug: 'bistro-rustique',
        description: 'Authentic woodfired recipes & french bistro experience.',
        logo: '🪵',
        whatsapp_number: '+1 555-0199',
      })
      return
    }

    try {
      // Fetch member profile
      const { data: memberData, error: memberError } = await supabase
        .from('restaurant_members')
        .select(`
          role,
          restaurant_id,
          restaurants (
            id,
            name,
            slug,
            description,
            logo,
            whatsapp_number
          )
        `)
        .eq('user_id', userId)
        .maybeSingle()

      if (memberError) {
        console.error('Error fetching membership info:', memberError)
        return
      }

      if (memberData) {
        setMember({
          role: memberData.role as any,
          restaurant_id: memberData.restaurant_id,
        })
        if (memberData.restaurants) {
          const rest = memberData.restaurants as any
          setRestaurant({
            id: rest.id,
            name: rest.name,
            slug: rest.slug,
            description: rest.description || '',
            logo: rest.logo || '🪵',
            whatsapp_number: rest.whatsapp_number || '',
          })
        }
      }
    } catch (err) {
      console.error('Error fetching onboarding data:', err)
    }
  }, [supabase])

  const refreshRestaurant = useCallback(async () => {
    if (!member?.restaurant_id) return
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', member.restaurant_id)
        .single()

      if (!error && data) {
        setRestaurant({
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          logo: data.logo || '🪵',
          whatsapp_number: data.whatsapp_number || '',
        })
      }
    } catch (err) {
      console.error('Error refreshing restaurant:', err)
    }
  }, [member?.restaurant_id, supabase])

  useEffect(() => {
    async function loadSession() {
      if (initialUser) {
        await fetchOnboardingData(initialUser.id)
        setLoading(false)
        return
      }

      try {
        const { data: { user: sessionUser } } = await supabase.auth.getUser()
        if (sessionUser) {
          setUser(sessionUser)
          await fetchOnboardingData(sessionUser.id)
        } else {
          // Fallback redirect if session doesn't load
          router.push('/login')
        }
      } catch (err) {
        console.error('Session load error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        setUser(session.user)
        await fetchOnboardingData(session.user.id)
      } else {
        setUser(null)
        setMember(null)
        setRestaurant(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, fetchOnboardingData, router])

  return (
    <AdminContext.Provider value={{ user, member, restaurant, loading, refreshRestaurant }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
