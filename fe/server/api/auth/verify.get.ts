import { defineEventHandler, getHeader, getQuery, createError } from 'h3'

const BE_MVG_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const query = getQuery(event)
  const token = authHeader?.replace(/^Bearer\s+/i, '') || (query.token as string)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Token autentikasi tidak ditemukan'
    })
  }

  try {
    const res = await fetch(`${BE_MVG_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    const data = await res.json().catch(() => null)

    if (!res.ok || !data || data.status !== 'success') {
      throw createError({
        statusCode: 401,
        statusMessage: data?.message || 'Sesi login tidak valid atau telah berakhir'
      })
    }

    return {
      status: 'success',
      valid: true,
      data: data.data || null,
      refreshedToken: data.token || null
    }
  } catch (err: any) {
    if (err.statusCode) throw err
    throw createError({
      statusCode: 401,
      statusMessage: 'Sesi login telah berakhir'
    })
  }
})
