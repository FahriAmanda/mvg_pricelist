import Papa from 'papaparse'
import crypto from 'node:crypto'
import type { PricelistItem, SheetCategory } from '../../types/pricelist'

export const SHEET_CATEGORIES: Array<{
  id: string
  name: string
  catalog: 'mvg' | 'av'
  gid?: string
  customUrl?: string
  icon: string
  description: string
}> = [
  // ==========================================
  // 1. PRICELIST MVG (11 Kategori Hardware & Rental)
  // ==========================================
  {
    id: 'mvg_rental_qiangli',
    name: 'LED Rental Qiangli',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThYwNYju97iRrpHX9xOTj175HWt0jS2rxFnuAIB0WReyrw6J60fhUruXItNVxw1xliGuGzonu2GvnG/pub?single=true&output=csv&gid=138853533',
    icon: 'Tv',
    description: 'LED Rental Videotron QiangLi P3.9 Outdoor, P2.6 Indoor, Corner & Curve Series'
  },
  {
    id: 'mvg_rental_fabulux',
    name: 'LED Rental Fabulux',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThYwNYju97iRrpHX9xOTj175HWt0jS2rxFnuAIB0WReyrw6J60fhUruXItNVxw1xliGuGzonu2GvnG/pub?single=true&output=csv&gid=2051319300',
    icon: 'Tv',
    description: 'LED Rental Fabulux Master Plus Outdoor, Alpha P2.6 Indoor 4in1 & Spider Max'
  },
  {
    id: 'mvg_rental_maven',
    name: 'LED Rental Maven',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vThYwNYju97iRrpHX9xOTj175HWt0jS2rxFnuAIB0WReyrw6J60fhUruXItNVxw1xliGuGzonu2GvnG/pub?single=true&output=csv&gid=71313678',
    icon: 'Layers',
    description: 'LED Rental Unilumin Lampro Maven P3.9 Outdoor & LRS P2.6 Indoor Pro Series'
  },
  {
    id: 'mvg_moka_effect',
    name: 'Moka Effect',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMZKsY_E8v5CzBcJhoDMzPQufBttGaW-rRc8xQKjKVrFr3ImMZFnG4BhedVuw3fXHaOa49gBcQHF52/pub?single=true&output=csv&gid=1814023888',
    icon: 'Flame',
    description: 'MOKA SFX CO2 Cannon, Double Barrel Jet, Fog Machine, Cold Sparkle & Flame Effects'
  },
  {
    id: 'mvg_mode_hoist',
    name: 'Mode Hoist',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRZlAlQToHz0HQRTyaIZTSLyWRldq5Vl-P3wwGHkgfkVhL_l8FCER30-xXbPV2yqhicb4CarQiSvSUa/pub?single=true&output=csv&gid=0',
    icon: 'ArrowDownUp',
    description: 'Electric Hoist 1T/2T 25m, Battery Free Hoist, Manual Chain & Group Controller'
  },
  {
    id: 'mvg_meanreal_lighting',
    name: 'Meanreal Lighting',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRc0ZTlXeHQkQYYpUUCBQhli6-DTzcL1-hOBLVThSYE8FGO4RxNst-820L_8TcADu7nP-ZQ1cNE6m2p/pub?single=true&output=csv&gid=1106248044',
    icon: 'Sun',
    description: 'Moving Head Beam, BSW 550, ALED, Follow Spot, GrandMA & Midas Console'
  },
  {
    id: 'mvg_alumino',
    name: 'Alumino',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbNen4_QKHGYt7sR5oRoz4PcYy7EUr83UxeoAuHjJgxmeSi2LysCLyEz1H8UZpPmRoB8V1YA4T5Fxo/pub?single=true&output=csv&gid=54137229',
    icon: 'Box',
    description: 'Rigging Bolt Truss 6082-T6, Box Connector, Sleeve Block, Roofing & Stage'
  },
  {
    id: 'mvg_ringlock',
    name: 'Ringlock',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYJtRrfWzuUhl6azjguN-umw3p0YOir6qHHbmU7w4Wz5Sg_6-xUiHDY3fdKVCzVdIkbIKASjIXwieL/pub?single=true&output=csv&gid=0',
    icon: 'Shield',
    description: 'Ringlock Scaffolding Paket 2x2x2m & Komponen Eceran Galvanis Q335'
  },
  {
    id: 'mvg_gaga_laser',
    name: 'Gaga Laser',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTjoA95fDO2TyDO7-sQwtrBLjJSILXgGw4vPTwPcovwPlBUP1K--oPQmEkxr-qb8GpZdjk6kv_Swwpi/pub?single=true&output=csv&gid=433321643',
    icon: 'Zap',
    description: 'GAGA Professional RGB Laser 3W - 40W Waterproof & Pangolin Quickshow FB3/FB4'
  },
  {
    id: 'mvg_mojo_barrier',
    name: 'Mojo Barrier',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqM6gJsENshXvwzI1WPxE9ZKQ1Ca-pAy-vnNb9pJt_LaMBffKgMiMWr4Ypxn5HcldfkNn6t71ELjXY/pub?single=true&output=csv&gid=1913829653',
    icon: 'ShieldAlert',
    description: 'Aluminum Crowd Control Barrier Straight, Corner 90-270° & Door Gate Quick Lock'
  },
  {
    id: 'mvg_aksesoris_rental',
    name: 'Aksesoris LED Rental',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSUGOUUw7perHoBvQYkjP8bGtMfNUMgVQ9wfnzg2K9vgtyoE9FMKilJroU8KR3sJmKmzHzA8KuspuIs/pub?single=true&output=csv&gid=1272438628',
    icon: 'Cable',
    description: 'Power Distribution Panel 3-Phase, PowerCON, Cat6, Clamps, Bracket & Fiber Optic'
  },

  // ==========================================
  // 2. AV PRICE LIST (10 Kategori Display & Controller)
  // ==========================================
  {
    id: 'qiangli',
    name: 'Module Qiangli',
    catalog: 'av',
    gid: '259985385',
    icon: 'Cpu',
    description: 'Modul LED QiangLi Indoor, Outdoor, dan Flexible Pro Series'
  },
  {
    id: 'lampro',
    name: 'Module Lampro',
    catalog: 'av',
    gid: '704458913',
    icon: 'Layers',
    description: 'Modul LED Lampro Indoor & Outdoor Pro Series'
  },
  {
    id: 'huidu',
    name: 'Huidu',
    catalog: 'av',
    gid: '1820403023',
    icon: 'Server',
    description: 'Huidu Controller, Video Processor, dan Media Player'
  },
  {
    id: 'colorlight',
    name: 'Colorlight',
    catalog: 'av',
    gid: '626330649',
    icon: 'Sparkles',
    description: 'Colorlight Receiving Cards, Media Players & Processors'
  },
  {
    id: 'novastar',
    name: 'Novastar',
    catalog: 'av',
    gid: '30080677',
    icon: 'Zap',
    description: 'NovaStar Receiving Cards, Sending Cards & Video Processors'
  },
  {
    id: 'cabinet',
    name: 'Cabinet',
    catalog: 'av',
    gid: '750788643',
    icon: 'Box',
    description: 'Cabinet Iron, Die-cast Aluminium & Rental Cabinet Accessories'
  },
  {
    id: 'psu',
    name: 'PSU',
    catalog: 'av',
    gid: '1803206925',
    icon: 'Plug',
    description: 'Power Supply Lampro, Meanwell, G-Energy 200W/300W/400W'
  },
  {
    id: 'led_poster',
    name: 'LED Poster',
    catalog: 'av',
    gid: '1858422740',
    icon: 'Tv',
    description: 'LED Poster Flat & Foldable Complete Sets with A35 Player'
  },
  {
    id: 'led_cube',
    name: 'LED Cube',
    catalog: 'av',
    gid: '435650943',
    icon: 'Boxes',
    description: 'LED Cube 4-Side & 5-Side 32x32cm dengan Modul, Controller & Rakitan'
  },
  {
    id: 'magnustek_tkdn',
    name: 'Magnustek TKDN',
    catalog: 'av',
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
    // ==========================================
    // 1. MVG: LED Rental Qiangli / Fabulux / Maven
    // ==========================================
    case 'mvg_rental_qiangli':
    case 'mvg_rental_fabulux':
    case 'mvg_rental_maven': {
      let currBrand =
        categoryId === 'mvg_rental_qiangli'
          ? 'QiangLi'
          : categoryId === 'mvg_rental_fabulux'
          ? 'Fabulux'
          : 'Unilumin Lampro'
      let currType = ''

      for (let i = 4; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        if (noVal.toLowerCase().startsWith('note') || !/^\d+$/.test(noVal)) continue

        const brand = r[2]?.trim().replace(/\n+/g, ' ') || currBrand
        currBrand = brand
        const rawType = r[3]?.trim() || currType
        currType = rawType
        const curve = r[4]?.trim() || ''
        const size = r[5]?.trim().replace(/\n+/g, '') || ''
        const hargaKredit = parsePrice(r[6])
        const hargaCash = parsePrice(r[7])
        const price = hargaCash > 0 ? hargaCash : hargaKredit
        const desc = r[8]?.trim() || ''

        let model = `${brand} ${rawType}`.trim()
        if (size) model += ` (${size})`
        const typeBadge =
          curve && curve !== '-'
            ? curve.toLowerCase().includes('no')
              ? 'Flat'
              : 'Curve'
            : 'Standard'

        const prefix =
          categoryId === 'mvg_rental_qiangli'
            ? 'RNT-QL'
            : categoryId === 'mvg_rental_fabulux'
            ? 'RNT-FB'
            : 'RNT-MVN'
        const sku = `${prefix}-${i}`

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model,
          type: typeBadge,
          description:
            desc ||
            `${brand} ${rawType} ${size ? 'Size: ' + size : ''} ${
              curve ? 'Curve: ' + curve : ''
            }`.trim(),
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          metadata: {
            hargaCash,
            hargaCashFormatted: formatRupiah(hargaCash),
            hargaKredit,
            hargaKreditFormatted: formatRupiah(hargaKredit),
            curve,
            size,
            brand
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 2. MVG: Moka Effect
    // ==========================================
    case 'mvg_moka_effect': {
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const code = r[0]?.trim() || ''
        const title = r[2]?.trim().replace(/\n+/g, ' ') || ''
        const price = parsePrice(r[3])
        const link = r[4]?.trim() || ''
        const sku = r[5]?.trim() || `SFX-MOKA-${code || i}`
        const desc = r[6]?.trim() || ''
        const cat = r[7]?.trim() || 'Special Effects'
        if (!title && !sku) continue

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model: title || `MOKA ${code}`,
          type: cat,
          description: desc || title,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          metadata: {
            code,
            videoUrl: link
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 3. MVG: Mode Hoist
    // ==========================================
    case 'mvg_mode_hoist': {
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        if (!/^\d+$/.test(noVal)) continue
        const desc = r[4]?.trim() || ''
        const price = parsePrice(r[5])
        const link = r[6]?.trim() || ''
        const lines = desc.split('\n').map((l) => l.trim()).filter(Boolean)

        let cap = ''
        let height = ''
        for (const line of lines) {
          if (line.toLowerCase().includes('capacity:')) cap = line.split(':')[1]?.trim() || ''
          if (line.toLowerCase().includes('lifting height:')) height = line.split(':')[1]?.trim() || ''
        }
        let model = lines[0] || `Mode Hoist #${noVal}`
        if (cap && height) {
          model += ` (${cap} - ${height})`
        } else if (cap) {
          model += ` (${cap})`
        }

        const typeBadge = model.toLowerCase().includes('electric')
          ? 'Electric'
          : model.toLowerCase().includes('battery')
          ? 'Battery'
          : model.toLowerCase().includes('manual')
          ? 'Manual'
          : 'Accessory'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model,
          type: typeBadge,
          description: desc,
          price,
          priceFormatted: formatRupiah(price),
          sku: `HOIST-MD-${noVal}`,
          metadata: {
            specLines: lines,
            capacity: cap,
            liftingHeight: height,
            videoUrl: link
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 4. MVG: Meanreal Lighting
    // ==========================================
    case 'mvg_meanreal_lighting': {
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        const item = r[2]?.trim().replace(/\n+/g, ' ') || ''
        if (!item) continue
        const spec = r[3]?.trim() || ''
        const price = parsePrice(r[12]) || parsePrice(r[11]) || parsePrice(r[4])
        const link = r[17]?.trim() || ''

        let typeBadge = 'Stage Lighting'
        const lower = item.toLowerCase()
        if (lower.includes('beam') || lower.includes('bsw')) typeBadge = 'Moving Head'
        else if (lower.includes('eye') || lower.includes('wash')) typeBadge = 'Wash / LED'
        else if (lower.includes('spot')) typeBadge = 'Follow Spot'
        else if (lower.includes('par')) typeBadge = 'PAR Light'
        else if (
          lower.includes('console') ||
          lower.includes('wing') ||
          lower.includes('midas') ||
          lower.includes('grandma') ||
          lower.includes('avolites')
        )
          typeBadge = 'DMX Console'
        else if (lower.includes('laser')) typeBadge = 'Laser'
        else if (lower.includes('strobe') || lower.includes('bar')) typeBadge = 'Strobe / Bar'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model: item,
          type: typeBadge,
          description: spec || item,
          price,
          priceFormatted: formatRupiah(price),
          sku: `MRL-LT-${noVal || i}`,
          metadata: {
            specification: spec,
            videoUrl: link
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 5. MVG: Alumino
    // ==========================================
    case 'mvg_alumino': {
      let currItem = ''
      let currDesc = ''
      for (let i = 3; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const itemRaw = r[0]?.trim().replace(/\n+/g, ' ') || ''
        const descRaw = r[2]?.trim() || ''
        if (itemRaw) currItem = itemRaw
        if (descRaw) currDesc = descRaw
        const size = r[3]?.trim().replace(/\n+/g, ' ') || ''
        const price = parsePrice(r[5])
        if (price === 0 && !size) continue

        let model = currItem
        if (size) model += ` (${size})`

        let typeBadge = 'Truss'
        const lower = currItem.toLowerCase()
        if (
          lower.includes('connector') ||
          lower.includes('block') ||
          lower.includes('corner')
        )
          typeBadge = 'Connector'
        else if (
          lower.includes('stage') ||
          lower.includes('stand') ||
          lower.includes('stair') ||
          lower.includes('board')
        )
          typeBadge = 'Stage System'
        else if (lower.includes('barrier') || lower.includes('mojo')) typeBadge = 'Barrier'
        else if (lower.includes('ringlock') || lower.includes('scaffolding'))
          typeBadge = 'Scaffolding'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model,
          type: typeBadge,
          description: currDesc || currItem,
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku: `ALU-TR-${i}`,
          metadata: {
            size,
            material: currDesc
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 6. MVG: Ringlock
    // ==========================================
    case 'mvg_ringlock': {
      const paketPrice = parsePrice('Rp5.240.000')
      items.push({
        id: `${categoryId}-paket`,
        category: categoryId,
        catalog: 'mvg',
        model: 'Ringlock Scaffolding Paket (2x2x2 Meter)',
        type: 'Paket Komplit',
        description:
          'Paket Komplit Scaffolding 2x2x2m (Vertical Standard 2m, Horizontal Ledger 2m, Diagonal Brace 2.5m, Jack Base 30cm)',
        size: '2x2x2 Meter',
        price: paketPrice,
        priceFormatted: formatRupiah(paketPrice),
        sku: 'RNG-SET-2X2X2',
        metadata: {
          isPaket: true
        },
        updatedAt: new Date().toISOString()
      })

      for (let i = 10; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const name = r[1]?.trim().replace(/\n+/g, ' ') || ''
        const spec = r[2]?.trim() || ''
        const price = parsePrice(r[3])
        if (!name || price === 0) continue

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model: name,
          type: 'Eceran Part',
          description: spec || name,
          price,
          priceFormatted: formatRupiah(price),
          sku: `RNG-PART-${i}`,
          metadata: {
            specification: spec
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 7. MVG: Gaga Laser
    // ==========================================
    case 'mvg_gaga_laser': {
      for (let i = 5; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        if (!/^\d+$/.test(noVal)) continue
        const rawTitle = r[1]?.trim() || ''
        const lines = rawTitle.split('\n').map((l) => l.trim()).filter(Boolean)
        const title = lines[0] || `GAGA Laser #${noVal}`
        const spec = lines.slice(1).join('\n')
        const price = parsePrice(r[4])
        const weight = r[5]?.trim() || ''
        const size = [r[6]?.trim(), r[7]?.trim(), r[8]?.trim()].filter(Boolean).join(' x ')
        const video = r[9]?.trim() || ''

        const isDongle =
          title.toLowerCase().includes('pangolin') ||
          title.toLowerCase().includes('quickshow')
        const typeBadge = isDongle
          ? 'Software / Dongle'
          : title.toLowerCase().includes('waterproof')
          ? 'Outdoor Laser'
          : 'RGB Laser'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model: title,
          type: typeBadge,
          description: spec || title,
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku: `GAG-LSR-${noVal}`,
          metadata: {
            weight,
            size,
            specification: spec,
            videoSample: video
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 8. MVG: Mojo Barrier
    // ==========================================
    case 'mvg_mojo_barrier': {
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4) continue
        const name = r[1]?.trim().replace(/\n+/g, ' ') || ''
        const spec = r[2]?.trim() || ''
        const price = parsePrice(r[3])
        if (!name || price === 0) continue

        let typeBadge = 'Straight Gate'
        if (name.toLowerCase().includes('corner')) typeBadge = 'Corner Gate'
        else if (name.toLowerCase().includes('door')) typeBadge = 'Door Gate'
        else if (name.toLowerCase().includes('wire')) typeBadge = 'Wire Slot'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model: name,
          type: typeBadge,
          description: spec || name,
          price,
          priceFormatted: formatRupiah(price),
          sku: `MOJO-BAR-${i}`,
          metadata: {
            specification: spec
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 9. MVG: Aksesoris LED Rental
    // ==========================================
    case 'mvg_aksesoris_rental': {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4) continue
        const noVal = r[0]?.trim() || ''
        const name = r[1]?.trim().replace(/\n+/g, ' ') || ''
        const price = parsePrice(r[3])
        const desc = r[4]?.trim() || ''
        if (!name || price === 0) continue

        let typeBadge = 'Accessories'
        const lower = name.toLowerCase()
        if (lower.includes('power panel') || lower.includes('distribution'))
          typeBadge = 'Power Distribution'
        else if (
          lower.includes('powercon') ||
          lower.includes('cable') ||
          lower.includes('lan') ||
          lower.includes('fo cable')
        )
          typeBadge = 'Cables & Data'
        else if (
          lower.includes('clamp') ||
          lower.includes('bracket') ||
          lower.includes('screw') ||
          lower.includes('bolt')
        )
          typeBadge = 'Rigging & Hardware'
        else if (lower.includes('flight case')) typeBadge = 'Flight Case'
        else if (
          lower.includes('receiving card') ||
          lower.includes('psu') ||
          lower.includes('hanging bar')
        )
          typeBadge = 'Spare Parts'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'mvg',
          model: name,
          type: typeBadge,
          description: desc || name,
          price,
          priceFormatted: formatRupiah(price),
          sku: `ACC-RNT-${noVal || i}`,
          metadata: {
            specification: desc
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 10. AV: Qiangli / Lampro Module
    // ==========================================
    case 'qiangli':
    case 'lampro': {
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
          catalog: 'av',
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

    // ==========================================
    // 11. AV: Huidu
    // ==========================================
    case 'huidu': {
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
          catalog: 'av',
          model: brand,
          type: subCat,
          description: productName,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          metadata: {
            rawSpecs
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 12. AV: Colorlight
    // ==========================================
    case 'colorlight': {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || (!r[1] && !r[2])) continue
        const brand = r[0]?.trim() || 'Colorlight'
        const rawType = r[1]?.trim() || ''
        const rawDesc = r[2]?.trim() || ''
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `${categoryId}-${i}`

        const isGenericDesc =
          rawDesc.toLowerCase() === 'receiving card' ||
          rawDesc.toLowerCase() === 'multimedia player' ||
          rawDesc.toLowerCase() === 'video processor' ||
          rawDesc.toLowerCase() === 'sending card'

        let displayModel = ''
        let displayType = ''

        if (isGenericDesc && rawType) {
          displayModel = rawType
          displayType = rawDesc
        } else {
          displayModel = rawType || rawDesc
          displayType = rawDesc || brand
        }

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'av',
          model: displayModel,
          type: displayType,
          description: `${brand} ${rawType} ${rawDesc}`.trim(),
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 13. AV: Novastar
    // ==========================================
    case 'novastar': {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || (!r[1] && !r[2])) continue
        const brand = r[0]?.trim() || 'Novastar'
        const rawType = r[1]?.trim() || ''
        const rawDesc = r[2]?.trim() || ''
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `${categoryId}-${i}`

        const isGenericDesc =
          rawDesc.toLowerCase() === 'receiving card' ||
          rawDesc.toLowerCase() === 'video processor' ||
          rawDesc.toLowerCase() === 'multimedia player' ||
          rawDesc.toLowerCase() === 'controller' ||
          rawDesc.toLowerCase() === 'sending card'

        let displayModel = ''
        let displayType = ''

        if (isGenericDesc && rawType) {
          displayModel = rawType
          displayType = rawDesc
        } else {
          displayModel = rawType || rawDesc
          displayType = rawDesc || brand
        }

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'av',
          model: displayModel,
          type: displayType,
          description: `${brand} ${rawType} ${rawDesc}`.trim(),
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 14. AV: Cabinet
    // ==========================================
    case 'cabinet': {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4 || !r[0]) continue
        const model = r[0]?.trim() || 'Cabinet'
        const type = r[1]?.trim() || ''
        const size = r[2]?.trim() || ''
        const price = parsePrice(r[3])
        const desc = r[4]?.trim() || ''
        const sku = r[5]?.trim() || `${categoryId}-${i}`

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'av',
          model,
          type,
          description: desc || `${type} ${size}`.trim(),
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 15. AV: PSU
    // ==========================================
    case 'psu': {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 6 || !r[0]) continue
        const model = r[0]?.trim() || 'PSU'
        const type = r[1]?.trim() || ''
        const desc = r[3]?.trim() || ''
        const watt = r[1]?.trim() || ''
        const price = parsePrice(r[5])
        const sku = r[6]?.trim() || `${categoryId}-${i}`

        const fullName = desc ? `${model} - ${desc}` : model

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'av',
          model,
          type,
          description: fullName,
          size: watt,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 16. AV: LED Poster
    // ==========================================
    case 'led_poster': {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || !r[2]) continue
        const brand = r[0]?.trim() || 'LED Poster'
        const rawType = r[1]?.trim() || ''
        const size = r[2]?.trim() || ''
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `${categoryId}-${i}`

        let typeBadge = 'Foldable'
        if (rawType.toLowerCase().includes('flat')) typeBadge = 'Flat'
        else if (rawType.toLowerCase().includes('foldable')) typeBadge = 'Foldable'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'av',
          model: brand,
          type: typeBadge,
          description: rawType || `${brand} ${size}`,
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 17. AV: LED Cube
    // ==========================================
    case 'led_cube': {
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 18 || !r[0]?.trim()) continue
        const rawType = r[0]?.trim()
        const price4Side = parsePrice(r[16])
        const price5Side = parsePrice(r[17]) || price4Side
        const size = r[18]?.trim() || '32x32x32cm'
        const sku = `LED-CUBE-${rawType.replace(/\s+/g, '-').toUpperCase()}`

        const isOutdoor = rawType.toLowerCase().includes('outdoor')
        const typeBadge = isOutdoor ? 'Outdoor' : 'Indoor'

        items.push({
          id: `${categoryId}-${i}`,
          category: categoryId,
          catalog: 'av',
          model: 'LED Cube 32x32cm',
          type: typeBadge,
          description: rawType,
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

    // ==========================================
    // 18. AV: Magnustek TKDN
    // ==========================================
    case 'magnustek_tkdn': {
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 6 || !r[3]) continue
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
          catalog: 'av',
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
          Pragma: 'no-cache',
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
      totalItems: Object.values(store.itemsByCategory).reduce(
        (acc, curr) => acc + curr.length,
        0
      ),
      lastSync: store.lastSync
    }
  }

  store.isFetching = true
  const now = new Date()
  let hasChanges = false
  const updatedCategories: string[] = []

  try {
    const fetchPromises = SHEET_CATEGORIES.map(async (cat) => {
      const url = cat.customUrl
        ? `${cat.customUrl}&_t=${Date.now()}`
        : `${BASE_CSV_URL}${cat.gid}&_t=${Date.now()}`

      try {
        const text = await fetchWithRetry(url)
        const items = parseSheetRows(cat.id, text)
        return { catId: cat.id, items, rawText: text }
      } catch (err: any) {
        console.warn(
          `[AutoSync] Catatan: Gagal memuat ${cat.name} (${
            err?.message || err
          }), menggunakan cache sebelumnya.`
        )
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
        totalItems: Object.values(store.itemsByCategory).reduce(
          (acc, curr) => acc + curr.length,
          0
        ),
        hash: store.contentHash
      })
    }

    return {
      success: true,
      updated: hasChanges,
      totalItems: Object.values(store.itemsByCategory).reduce(
        (acc, curr) => acc + curr.length,
        0
      ),
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

  fetchAllSheets(true).catch(console.error)

  setInterval(() => {
    fetchAllSheets(false).catch(console.error)
  }, 60 * 1000)
}
