/**
 * URL Supabase redirects to after Google OAuth.
 * Must be listed in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.
 */
export function getOAuthRedirectTo(): string {
  const fromEnv = import.meta.env.VITE_APP_URL as string | undefined
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.replace(/\/$/, '')
  }
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return ''
}
