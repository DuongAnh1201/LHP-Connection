export interface Post {
  id: number
  name: string
  class: string
  school_year: string
  city: string
  country: string
  caption: string
  linkedin_url: string | null
  facebook_url: string | null
  /** Google account email captured at join / last profile save */
  email: string | null
  image_url: string | null
  lat: number | null
  lng: number | null
  user_id: string | null
  is_active: boolean
  created_at: string
}

export type View = 'list' | 'join' | 'profile'

export type GlobeMode = 'arcs' | 'cities'
