import Papa from 'papaparse'
import crypto from 'node:crypto'
import type { PricelistItem, SheetCategory } from '../../types/pricelist'

export const SHEET_CATEGORIES: Array<{
  id: string
  name: string
  gid: string
  icon: string
  description: string
}> = [
  {
    id: 'qiangli',
    name: 'Module Qiangli',
    gid: '259985385',
    icon: 'Cpu',
    description: 'Modul LED QiangLi Indoor, Outdoor, dan Flexible Pro Series'
  },
  {
    id: 'lampro',
    name: 'Module Lampro',
    gid: '704458913',
    icon: 'Layers',
    description: 'Modul LED Lampro Indoor & Outdoor Pro Series'
  },
  {
    id: 'huidu',
    name: 'Huidu',
    gid: '1820403023',
    icon: 'Server',
    description: 'Huidu Controller, Video Processor, dan Media Player'
  },
  {
    id: 'colorlight',
    name: 'Colorlight',
    gid: '626330649',
    icon: 'Sparkles',
    description: 'Colorlight Receiving Cards, Media Players & Processors'
  },
  {
    id: 'novastar',
    name: 'Novastar',
    gid: '30080677',
    icon: 'Zap',
    description: 'NovaStar Receiving Cards, Sending Cards & Video Processors'
  },
  {
    id: 'cabinet',
    name: 'Cabinet',
    gid: '750788643',
    icon: 'Box',
    description: 'Cabinet Iron, Die-cast Aluminium & Rental Cabinet Accessories'
  },
  {
    id: 'psu',
    name: 'PSU',
    gid: '1803206925',
    icon: 'Plug',
    description: 'Power Supply Lampro, Meanwell, G-Energy 200W/300W/400W'
  },
  {
    id: 'led_poster',
    name: 'LED Poster',
    gid: '1858422740',
    icon: 'Tv',
    description: 'LED Poster Flat & Foldable Complete Sets with A35 Player'
  },
  {
    id: 'led_cube',
    name: 'LED Cube',
    gid: '435650943',
    icon: 'Boxes',
    description: 'LED Cube 4-Side & 5-Side 32x32cm dengan Modul, Controller & Rakitan'
  },
  {
    id: 'magnustek_tkdn',
    name: 'Magnustek TKDN',
    gid: '1564770284',
    icon: 'ShieldCheck',
    description: 'LED Videotron Magnustek Bersertifikat Resmi TKDN Kemenperin'
  }
]

const BASE_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuMDmEzh4w7r09LH3Quoio4lHUZIR7Krur4FNfuxCskrN0onGEyiDGtr_ff7NGRG47Uq8HaNhXmS1a/pub?single=true&output=csv&gid='

export function parsePrice(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0
  if (typeof val === 'number') return val
  const str = String(val).trim()
  if (!str) return 0
  const clean = str.replace(/[^\d]/g, '')
  return clean ? parseInt(clean, 10) : 0
}

export function formatRupiah(num: number): string {
  if (!num) return 'Rp 0'
  return `Rp ${num.toLocaleString('id-ID')}`
}

export interface StoreState {
  itemsByCategory: Record<string, PricelistItem[]>
  previousPrices: Record<string, number>
  lastSync: string
  contentHash: string
  isFetching: boolean
}

const store: StoreState = {
  itemsByCategory: {},
  previousPrices: {},
  lastSync: '',
  contentHash: '',
  isFetching: false
}

// SSE Subscriber management
type SSEClient = {
  id: string
  send: (data: string) => void
}
const sseClients = new Set<SSEClient>()

export function registerSSEClient(client: SSEClient) {
  sseClients.add(client)
  return () => {
    sseClients.delete(client)
  }
}

export function broadcastSSE(event: string, payload: any) {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`
  for (const client of sseClients) {
    try {
      client.send(message)
    } catch {
      sseClients.delete(client)
    }
  }
}

function parseSheetRows(categoryId: string, rawCsv: string): PricelistItem[] {
  const parsed = Papa.parse<string[]>(rawCsv, {
    skipEmptyLines: 'greedy'
  })
  const rows = parsed.data
  if (!rows || rows.length < 2) return []

  const items: PricelistItem[] = []

  switch (categoryId) {
    case 'qiangli':
    case 'lampro': {
      // Headers: MODEL, TIPE, DESKRIPSI, UKURAN, HARGA, REFRESH, SKU
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || !r[2]) continue
        const model = r[0]?.trim() || ''
        const type = r[1]?.trim() || ''
        const desc = r[2]?.trim() || ''
        const size = r[3]?.trim() || ''
        const price = parsePrice(r[4])
        const refresh = r[5]?.trim() || ''
        const sku = r[6]?.trim() || `${categoryId}-${i}`

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model,
          type,
          description: desc,
          size,
          refreshRate: refresh,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'huidu': {
      // Headers: MODEL, TIPE, DESKRIPSI, CATEGORY, HARGA, SKU
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || !r[1]) continue
        const brand = r[0]?.trim() || 'Huidu'
        const productName = r[1]?.trim() || ''
        const rawSpecs = r[2]?.trim() || ''
        const subCat = r[3]?.trim() || 'Multimedia Player'
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `${categoryId}-${i}`

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model: brand,
          type: subCat, // Clean short badge: "Multimedia Player", "Receiving Card", etc.
          description: productName, // Real product name e.g. "Huidu HD-A3L Full-Color LED Controller"
          size: subCat,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          metadata: {
            subCategory: subCat,
            specs: rawSpecs.replace(/\n+/g, ' • ')
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'colorlight': {
      // Headers: MODEL, TIPE, DESKRIPSI, UKURAN, HARGA, SKU
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || !r[1]) continue
        const brand = r[0]?.trim() || 'Colorlight'
        const productName = r[1]?.trim() || ''
        const subCat = r[2]?.trim() || 'Receiving Card'
        const size = r[3]?.trim() || ''
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `${categoryId}-${i}`

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model: brand,
          type: subCat, // Clean short badge: "Receiving Card", "Video Processor", etc.
          description: productName, // Real product name e.g. "Colorlight E80 LED Receiving Card"
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'novastar': {
      // Headers: MODEL, TIPE, DESKRIPSI, Pict, HARGA, SKU
      // Row 1 might be empty/junk in Novastar sheet
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5) continue
        const productName = r[1]?.trim() || ''
        // Ignore header artifact rows
        if (!productName || productName === '0' || productName === 'TIPE') continue
        const brand = r[0]?.trim() || 'Novastar'
        const subCat = r[2]?.trim() || 'Receiving Card'
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `NS-${i}`

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model: brand,
          type: subCat, // Clean short badge: "Receiving Card", "Video Processor", etc.
          description: productName, // Real product name e.g. "NovaStar DH7508 Receiving Card"
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'cabinet': {
      // Headers: MODEL, UKURAN, DESKRIPSI, HARGA, SKU
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4 || !r[0]) continue
        const model = r[0]?.trim() || ''
        const size = r[1]?.trim() || ''
        const desc = r[2]?.trim() || ''
        const price = parsePrice(r[3])
        const sku = r[4]?.trim() || `${categoryId}-${i}`

        const fullName = `${model} ${size}`.trim()
        const cleanType = model.includes('Iron') ? 'Iron' : (model.includes('Die-cast') ? 'Die-Cast' : 'Cabinet')

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model,
          type: cleanType,
          description: fullName, // e.g. "Cabinet Iron 96x96cm"
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          metadata: {
            specs: desc.replace(/\n+/g, ' • ')
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'psu': {
      // Headers: MODEL, TIPE, PICT, DESKRIPSI, UKURAN, HARGA, SKU
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 6 || !r[0]) continue
        const model = r[0]?.trim() || ''
        const type = r[1]?.trim() || ''
        const desc = r[3]?.trim() || ''
        const size = r[4]?.trim() || ''
        const price = parsePrice(r[5])
        const sku = r[6]?.trim() || `${categoryId}-${i}`

        const fullName = desc ? `${model} - ${desc}` : model

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model,
          type,
          description: fullName, // e.g. "LAMPRO Power Supply - LD200-V001 4.5V"
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'led_poster': {
      // Headers: TYPE, PRICE Cabinet Flat With A35 Player, PRICE Cabinet Foldable With A35 Player, SIZE, SKU
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4 || !r[0] || r[0] === 'TYPE') continue
        const rawType = r[0]?.trim() // e.g. "Qiangli P4 Pro Indoor"
        const flatPrice = parsePrice(r[1])
        const foldPrice = parsePrice(r[2])
        const size = r[3]?.trim() || ''
        const sku = r[4]?.trim() || `${categoryId}-${i}`

        const isOutdoor = rawType.toLowerCase().includes('outdoor')
        const typeBadge = isOutdoor ? 'Outdoor' : 'Indoor'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model: 'LED Poster Series',
          type: typeBadge,
          description: rawType, // Clean product name e.g. "Qiangli P4 Pro Indoor"
          size,
          price: flatPrice, // Flat as base price
          priceFormatted: formatRupiah(flatPrice),
          sku,
          metadata: {
            flatPrice,
            flatPriceFormatted: formatRupiah(flatPrice),
            foldablePrice: foldPrice,
            foldablePriceFormatted: formatRupiah(foldPrice)
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'led_cube': {
      // Row 0/1 are dual headers
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 18 || !r[0]) continue
        const rawType = r[0]?.trim()
        const price4Side = parsePrice(r[16]) // CUBE 4 SIDE With A35 player
        const price5Side = parsePrice(r[17]) // CUBE 5 SIDE With A35 player
        const size = r[18]?.trim() || '32x32x32cm'
        const sku = `LED-CUBE-${rawType.replace(/\s+/g, '-').toUpperCase()}`

        const isOutdoor = rawType.toLowerCase().includes('outdoor')
        const typeBadge = isOutdoor ? 'Outdoor' : 'Indoor'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model: 'LED Cube 32x32cm',
          type: typeBadge,
          description: rawType, // Clean product name e.g. "Qiangli P4 Pro Indoor"
          size,
          price: price4Side,
          priceFormatted: formatRupiah(price4Side),
          sku,
          metadata: {
            price4Side,
            price4SideFormatted: formatRupiah(price4Side),
            price5Side,
            price5SideFormatted: formatRupiah(price5Side),
            modulePriceRmb: r[1]?.trim() || '',
            modulePriceIdr: parsePrice(r[2]),
            cabinet4Side: parsePrice(r[5]),
            cabinet5Side: parsePrice(r[6]),
            psuCost: parsePrice(r[8]),
            rcCost: parsePrice(r[10]),
            cableCost: parsePrice(r[11]) + parsePrice(r[12]),
            assemblyCost: parsePrice(r[13]),
            processorCost: parsePrice(r[14])
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    case 'magnustek_tkdn': {
      // Headers: NO, MODEL, TIPE, DESKRIPSI, NILAI TKDN, HARGA, PAKET, TIPE, UKURAN, REFRESH RATE HZ, SKU
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 6 || !r[3]) continue
        const no = r[0]?.trim()
        const model = r[1]?.trim() || 'TKDN MAGNUSTEK'
        const type = r[2]?.trim() || ''
        const desc = r[3]?.trim() || ''
        const tkdnValue = r[4]?.trim() || ''
        const price = parsePrice(r[5])
        const paket = r[6]?.trim() || ''
        const subType = r[7]?.trim() || ''
        const size = r[8]?.trim() || ''
        const refresh = r[9]?.trim() || ''
        const sku = r[10]?.trim() || `MAG-TKDN-${i}`

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          model,
          type: `${type} (${subType || paket})`,
          description: desc,
          size,
          refreshRate: refresh,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          metadata: {
            tkdnValue,
            paket,
            subType
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }
  }

  return items
}

async function fetchWithRetry(url: string, retries = 2, timeoutMs = 8000): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (compatible; MVG-Pricelist/1.0)'
        }
      })
      clearTimeout(timer)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.text()
    } catch (err: any) {
      clearTimeout(timer)
      if (attempt === retries) {
        throw err
      }
      await new Promise((r) => setTimeout(r, 600 * attempt))
    }
  }
  throw new Error('Fetch failed after retries')
}

export async function fetchAllSheets(force = false): Promise<{
  success: boolean
  updated: boolean
  totalItems: number
  lastSync: string
}> {
  if (store.isFetching) {
    return {
      success: true,
      updated: false,
      totalItems: Object.values(store.itemsByCategory).reduce((acc, curr) => acc + curr.length, 0),
      lastSync: store.lastSync
    }
  }

  store.isFetching = true
  const now = new Date()
  let hasChanges = false
  const updatedCategories: string[] = []

  try {
    const fetchPromises = SHEET_CATEGORIES.map(async (cat) => {
      const url = `${BASE_CSV_URL}${cat.gid}&_t=${Date.now()}`
      try {
        const text = await fetchWithRetry(url)
        const items = parseSheetRows(cat.id, text)
        return { catId: cat.id, items, rawText: text }
      } catch (err: any) {
        console.warn(`[AutoSync] Catatan: Gagal memuat ${cat.name} (${err?.message || err}), menggunakan cache sebelumnya.`)
        return { catId: cat.id, items: store.itemsByCategory[cat.id] || [], rawText: '' }
      }
    })

    const results = await Promise.all(fetchPromises)

    // Calculate composite hash
    const hash = crypto.createHash('md5')
    for (const r of results) {
      hash.update(r.rawText)
    }
    const newHash = hash.digest('hex')

    if (newHash !== store.contentHash || force) {
      hasChanges = true
      store.contentHash = newHash

      for (const r of results) {
        // Map price changes
        const previousCatItems = store.itemsByCategory[r.catId] || []
        const prevPriceMap = new Map<string, number>()
        for (const item of previousCatItems) {
          prevPriceMap.set(item.sku, item.price)
        }

        const enrichedItems = r.items.map((item) => {
          const oldPrice = prevPriceMap.get(item.sku) ?? store.previousPrices[item.sku]
          if (oldPrice !== undefined && oldPrice !== item.price) {
            item.previousPrice = oldPrice
          }
          store.previousPrices[item.sku] = item.price
          return item
        })

        store.itemsByCategory[r.catId] = enrichedItems
        updatedCategories.push(r.catId)
      }

      store.lastSync = now.toISOString()

      // Broadcast update to all connected SSE clients
      broadcastSSE('sync', {
        type: 'sync',
        lastSync: store.lastSync,
        updatedCategories,
        totalItems: Object.values(store.itemsByCategory).reduce((acc, curr) => acc + curr.length, 0),
        hash: store.contentHash
      })
    }

    return {
      success: true,
      updated: hasChanges,
      totalItems: Object.values(store.itemsByCategory).reduce((acc, curr) => acc + curr.length, 0),
      lastSync: store.lastSync
    }
  } finally {
    store.isFetching = false
  }
}

export function getStoreState(): StoreState {
  return store
}

export function getCategoryItems(categoryId: string): PricelistItem[] {
  return store.itemsByCategory[categoryId] || []
}

// Background auto-sync interval (every 60 seconds)
let intervalStarted = false
export function startAutoSyncPoller() {
  if (intervalStarted) return
  intervalStarted = true

  // Initial fetch immediately
  fetchAllSheets(true).catch(console.error)

  // Periodic poll every 60 seconds
  setInterval(() => {
    fetchAllSheets(false).catch(console.error)
  }, 60 * 1000)
}
