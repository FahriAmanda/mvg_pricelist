export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })

  const base = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'

  try {
    const res = await fetch(`${base}/api/marketing/pricelist-synced-items`, {
      headers: {
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(15000)
    })

    if (!res.ok) {
      throw new Error(`ERP Backend returned HTTP ${res.status}`)
    }

    const json = await res.json()
    return json
  } catch (err: any) {
    event.node.res.statusCode = 502
    return {
      status: 'error',
      message: err?.message || 'Gagal mengambil data item sinkronisasi dari ERP'
    }
  }
})
