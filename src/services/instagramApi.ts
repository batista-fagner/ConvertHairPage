const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api$/, '/api')

export interface InstagramProfile {
  id: string
  username: string
  full_name: string
  biography: string
  is_private: boolean
  profile_pic_url: string
  profile_pic_url_hd: string
  followers: number
  following: number
  posts: number
}

export async function fetchInstagramProfile(username: string): Promise<InstagramProfile | null> {
  const handle = username.replace('@', '').trim()

  try {
    const res = await fetch(`${BASE_URL}/instagram/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: handle }),
    })

    if (!res.ok) return null

    const data = await res.json()

    // estrutura /profile
    const p = data?.result
    if (p && !Array.isArray(data?.result)) {
      return {
        id: p.id ?? '',
        username: p.username ?? handle,
        full_name: p.full_name ?? '',
        biography: p.biography ?? '',
        is_private: p.is_private ?? false,
        profile_pic_url: p.profile_pic_url ?? '',
        profile_pic_url_hd: p.profile_pic_url_hd ?? '',
        followers: p.edge_followed_by?.count ?? 0,
        following: p.edge_follow?.count ?? 0,
        posts: p.edge_owner_to_timeline_media?.count ?? 0,
      }
    }

    // estrutura /userInfo (fallback feito pelo backend)
    const u = data?.result?.[0]?.user
    if (!u) return null

    return {
      id: u.pk ?? '',
      username: u.username ?? handle,
      full_name: u.full_name ?? '',
      biography: u.biography ?? '',
      is_private: u.is_private ?? false,
      profile_pic_url: u.profile_pic_url ?? '',
      profile_pic_url_hd: u.hd_profile_pic_url_info?.url ?? u.profile_pic_url ?? '',
      followers: u.follower_count ?? 0,
      following: u.following_count ?? 0,
      posts: u.media_count ?? 0,
    }
  } catch {
    return null
  }
}
