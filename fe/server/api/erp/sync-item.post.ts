import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { updateItemErpSyncStatus } from '../../utils/sheets'

const BE_MVG_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'

export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autentikasi diperlukan. Silakan login sebagai Super Admin.'
    })
  }

  const body = await readBody(event)
  const { m_items_id, sku, harga, harga_kredit, bt_price, image_url, previous_m_items_id } = body || {}

  if (!m_items_id || !sku) {
    throw createError({
      statusCode: 400,
      statusMessage: 'm_items_id dan sku wajib disertakan.'
    })
  }

  try {
    const res = await fetch(`${BE_MVG_URL}/api/marketing/sync-item-sku`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        m_items_id,
        sku,
        harga,
        harga_kredit,
        bt_price,
        image_url,
        previous_m_items_id
      })
    })

    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.status !== 'success') {
      throw createError({
        statusCode: res.status || 400,
        statusMessage: data?.message || 'Gagal melakukan sinkronisasi dengan ERP'
      })
    }

    // Instantly update Nitro memory cache
    const availableStock = Number(data.data?.available_stock || 0)
    updateItemErpSyncStatus(sku, true, availableStock)

    return data
  } catch (err: any) {
    console.error('[API /api/erp/sync-item] Error:', err)
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Gagal menghubungi server BE_MVG'
    })
  }
})
