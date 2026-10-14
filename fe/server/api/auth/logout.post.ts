import { defineEventHandler, getHeader } from 'h3'

const BE_MVG_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')

  if (token) {
    try {
      await fetch(`${BE_MVG_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (_) {}
  }

  return { status: 'success', message: 'Logged out successfully' }
})
