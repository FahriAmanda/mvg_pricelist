import { defineEventHandler, getQuery, getHeader, createError } from 'h3'

const BE_MVG_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autentikasi diperlukan. Silakan login terlebih dahulu.'
    })
  }

  const query = getQuery(event)
  const search = String(query.search || '').trim()
  const limit = String(query.limit || '50')

  const url = new URL(`${BE_MVG_URL}/api/marketing/unsynced-items`)
  if (search) url.searchParams.set('search', search)
  if (limit) url.searchParams.set('limit', limit)

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    })

    const data = await res.json().catch(() => null)
    if (!res.ok || !data) {
      throw createError({
        statusCode: res.status || 500,
        statusMessage: data?.message || 'Gagal memuat daftar item ERP'
      })
    }

    return data
  } catch (err: any) {
    console.error('[API /api/erp/unsynced-items] Error:', err)
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Gagal menghubungi server BE_MVG'
    })
  }
})
