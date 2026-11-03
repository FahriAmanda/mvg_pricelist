import { defineEventHandler, getHeader, createError } from 'h3'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { fetchAllSheets } from '../../utils/sheets'

const execAsync = promisify(exec)
const BE_MVG_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'
const HERMES_SECRET = process.env.HERMES_PRICELIST_SECRET || 'ABZpgzdN9Ork-mO6BlYktDGDeiKlzpKhIFX8Hz7RxxQtvZDvU1TEA8JjyYudYBSU'
const USER_AGENT = 'Mozilla/5.0 (compatible; MVG-Hermes-Governance/1.0)'

export default defineEventHandler(async (event) => {
  // Allow authenticated users to trigger manual synchronization
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Autentikasi diperlukan. Silakan masuk terlebih dahulu.'
    })
  }

  let resultData: any = null
  let usedMethod = ''

  // 1. Try running Hermes governance runner via docker exec (runs audited flow + readback + Fox notification)
  try {
    const { stdout } = await execAsync(
      'docker exec hermes-vps python3 /opt/data/scripts/hermes_pricelist_governance.py --force',
      { timeout: 150000 }
    )
    const lines = stdout.trim().split('\n').map((l) => l.trim()).filter(Boolean)
    const jsonLine = [...lines].reverse().find((l) => l.startsWith('{') && l.endsWith('}'))
    if (jsonLine) {
      resultData = JSON.parse(jsonLine)
      usedMethod = 'HERMES_VPS_DOCKER'
    }
  } catch (err: any) {
    console.warn('[Sync] Docker runner fallback to HTTP direct sync:', err?.message || err)
  }

  // 2. Fallback to direct HTTP sync to backend if docker runner wasn't available or failed
  if (!resultData) {
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const res = await fetch(`${BE_MVG_URL}/api/marketing/hermes-pricelist-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hermes-pricelist-secret': HERMES_SECRET,
            'User-Agent': USER_AGENT
          },
          body: JSON.stringify({
            mode: 'FORCE_MANUAL',
            actor: 'WEB_PRICELIST_MANUAL'
          }),
          signal: AbortSignal.timeout(120000)
        })

        if (res.status === 409 && attempt < 6) {
          console.warn(`[Sync] Conflict 409 detected, retry attempt ${attempt}/6 in 3s...`)
          await new Promise((r) => setTimeout(r, 3000))
          continue
        }

        const data = await res.json()
        if (!res.ok || data?.status !== 'success') {
          throw createError({
            statusCode: res.status || 500,
            statusMessage: data?.message || 'Gagal menyinkronkan harga via Backend'
          })
        }

        resultData = data.data
        usedMethod = 'BE_HTTP_DIRECT'
        break
      } catch (httpErr: any) {
        if (attempt === 6) {
          throw createError({
            statusCode: 500,
            statusMessage: `Gagal menjalankan sinkronisasi: ${httpErr?.message || httpErr}`
          })
        }
        await new Promise((r) => setTimeout(r, 3000))
      }
    }
  }

  // 3. Immediately refresh Nuxt in-memory pricelist cache so all visitors get the new prices
  try {
    await fetchAllSheets(true)
  } catch (cacheErr) {
    console.error('[Sync] Error refreshing in-memory sheets cache:', cacheErr)
  }

  const summary = resultData?.summary || {}
  const priceUpdates = Number(summary.priceUpdates ?? summary.cashUpdates ?? 0)
  const total = Number(summary.total ?? 0)
  const approved = Number(summary.approved ?? 0)

  return {
    status: 'success',
    message: priceUpdates > 0
      ? `Sinkronisasi selesai! Berhasil memperbarui ${priceUpdates} harga dari Google Sheets ke Pricelist & ERP.`
      : 'Sinkronisasi selesai! Seluruh harga dari Google Sheets sudah sesuai dan mutakhir di Web Pricelist & ERP.',
    data: {
      version: resultData?.version,
      summary,
      priceUpdates,
      total,
      approved,
      method: usedMethod,
      timestamp: new Date().toISOString()
    }
  }
})
