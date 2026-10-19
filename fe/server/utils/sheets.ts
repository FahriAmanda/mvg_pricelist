import Papa from 'papaparse'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import erpStockInitialCache from './erpStockCache.json'
import type { PricelistItem, SheetCategory } from '../../types/pricelist'

const BASELINE_CACHE_PATH = path.resolve(process.cwd(), '.cache/pricelist_master_baseline.json')

function loadPersistentBaseline(): Record<string, number> {
  try {
    if (fs.existsSync(BASELINE_CACHE_PATH)) {
      const raw = fs.readFileSync(BASELINE_CACHE_PATH, 'utf-8')
      const data = JSON.parse(raw)
      console.log(`[PricelistBaseline] 📂 Loaded ${Object.keys(data).length} baseline prices (MVG & AV) from persistent disk cache.`)
      return data
    }
  } catch (err: any) {
    console.warn('[PricelistBaseline] Failed to load persistent baseline:', err?.message)
  }
  return {}
}

function savePersistentBaseline(prices: Record<string, number>) {
  try {
    const dir = path.dirname(BASELINE_CACHE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(BASELINE_CACHE_PATH, JSON.stringify(prices, null, 2), 'utf-8')
  } catch (err: any) {
    console.warn('[PricelistBaseline] Failed to save persistent baseline:', err?.message)
  }
}

interface PriceCandidate {
  candidatePrice: number
  firstSeenAt: number
  lastSeenAt: number
  observations: number
}

const CANDIDATE_CACHE_PATH = path.resolve(process.cwd(), '.cache/pricelist_pending_candidates.json')

function loadPendingCandidates(): Record<string, PriceCandidate> {
  try {
    if (fs.existsSync(CANDIDATE_CACHE_PATH)) {
      const raw = fs.readFileSync(CANDIDATE_CACHE_PATH, 'utf-8')
      const data = JSON.parse(raw)
      console.log(`[PricelistCandidates] 📂 Loaded ${Object.keys(data).length} candidate prices from persistent disk cache.`)
      return data
    }
  } catch (err: any) {
    console.warn('[PricelistCandidates] Failed to load pending candidates:', err?.message)
  }
  return {}
}

function savePendingCandidates(candidates: Record<string, PriceCandidate>) {
  try {
    const dir = path.dirname(CANDIDATE_CACHE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CANDIDATE_CACHE_PATH, JSON.stringify(candidates, null, 2), 'utf-8')
  } catch (err: any) {
    console.warn('[PricelistCandidates] Failed to save pending candidates:', err?.message)
  }
}

let pendingCandidates: Record<string, PriceCandidate> = loadPendingCandidates()

const STABILIZED_CACHE_PATH = path.resolve(process.cwd(), '.cache/pricelist_stabilized.json')

function loadStabilizedAdopted(): Record<string, number> {
  try {
    if (fs.existsSync(STABILIZED_CACHE_PATH)) {
      const raw = fs.readFileSync(STABILIZED_CACHE_PATH, 'utf-8')
      const data = JSON.parse(raw)
      console.log(`[PricelistStabilized] 📂 Loaded ${Object.keys(data).length} stabilized prices from persistent disk cache.`)
      return data
    }
  } catch (err: any) {
    console.warn('[PricelistStabilized] Failed to load stabilized prices:', err?.message)
  }
  return {}
}

function saveStabilizedAdopted(stabilized: Record<string, number>) {
  try {
    const dir = path.dirname(STABILIZED_CACHE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(STABILIZED_CACHE_PATH, JSON.stringify(stabilized, null, 2), 'utf-8')
  } catch (err: any) {
    console.warn('[PricelistStabilized] Failed to save stabilized prices:', err?.message)
  }
}

let stabilizedAdoptedSkus: Record<string, number> = loadStabilizedAdopted()

async function promoteStabilizedPriceToErp(sku: string, cashPrice: number, kreditPrice?: number | null, bottomPrice?: number | null) {
  try {
    const BE_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'
    const res = await fetch(`${BE_URL}/api/marketing/promote-stabilized-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku,
        cash_price: cashPrice,
        kredit_price: kreditPrice || null,
        bottom_price: bottomPrice || null,
        source: 'WEB_PRICELIST_STABILIZATION'
      })
    })
    if (res.ok) {
      const data: any = await res.json()
      console.log(`[PricelistPromotion] ✅ Promoted ${sku} to ERP Master:`, data?.message)
    } else {
      console.warn(`[PricelistPromotion] ⚠️ Failed to promote ${sku} to ERP: HTTP ${res.status}`)
    }
  } catch (e: any) {
    console.warn(`[PricelistPromotion] ⚠️ Network error promoting ${sku} to ERP:`, e?.message)
  }
}

// Stabilization duration: if the sheet consistently displays the exact same price
// for >= 2 minutes (120,000 ms) and at least 2 observations, consider it intentional and adopt it!
const STABILIZATION_WINDOW_MS = 2 * 60 * 1000

let erpStockMap: Record<string, any> = { ...erpStockInitialCache }
let lastStockFetch = 0

async function refreshErpStockMap() {
  const now = Date.now()
  if (now - lastStockFetch < 30000 && Object.keys(erpStockMap).length > 0) {
    return erpStockMap
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)
    const BE_URL = process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'
    const res = await fetch(`${BE_URL}/api/marketing/pricelist-sync-stock`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    })
    clearTimeout(timeoutId)

    if (res.ok) {
      const json: any = await res.json()
      if (json && json.status === 'success' && json.data) {
        erpStockMap = { ...erpStockInitialCache, ...json.data }
        lastStockFetch = now
      }
    }
  } catch (err: any) {
    // Silently fall back to cached stock
  }
  return erpStockMap
}

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
  {
    id: 'mvg_instalasi_led',
    name: 'Instalasi LED',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuMDmEzh4w7r09LH3Quoio4lHUZIR7Krur4FNfuxCskrN0onGEyiDGtr_ff7NGRG47Uq8HaNhXmS1a/pub?single=true&output=csv&gid=81890595',
    icon: 'Monitor',
    description: 'Price List Paket Instalasi LED Videotron Modular & Cabinet (Qiangli & ABSEN Pro Series)'
  },
  {
    id: 'mvg_finished_cabinet',
    name: 'Finished Cabinet',
    catalog: 'mvg',
    customUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRuMDmEzh4w7r09LH3Quoio4lHUZIR7Krur4FNfuxCskrN0onGEyiDGtr_ff7NGRG47Uq8HaNhXmS1a/pub?single=true&output=csv&gid=2026050501',
    icon: 'LayoutGrid',
    description: 'Finished Cabinet Die-Cast, Iron, Curve, Corner & COB 600x337.5mm Siap Pakai'
  },

  // ==========================================
  // 2. AV PRICE LIST (11 Kategori Display & Controller)
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
    customUrl: 'https://docs.google.com/spreadsheets/d/1LcCyULM6UJ_c5wKFWF3fgMX350PMMGeGSCZrRUl3148/export?format=csv&gid=958507118',
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
    gid: '773747421',
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
  },
  {
    id: 'finished_cabinet',
    name: 'Finished Cabinet',
    catalog: 'av',
    gid: '2026050501',
    icon: 'LayoutGrid',
    description: 'Finished Cabinet Die-Cast, Iron, Curve, Corner & COB 600x337.5mm'
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

export interface CategoryExtra {
  bannerTitle?: string
  bannerSubtitle?: string
  bannerImage?: string
  kursUSD?: string
  notes?: string[]
  comparisonChart?: string
}

export const DEFAULT_CATEGORY_EXTRA: Record<string, CategoryExtra> = {
  // MVG Categories
  mvg_rental_qiangli: {
    bannerTitle: 'PRICE LIST PRODUK LED RENTAL /METER PERSEGI',
    bannerSubtitle: 'Katalog Resmi QiangLi Rental Series Mitra Visual Group (MVG)',
    kursUSD: 'Rp18.069',
    notes: [
      '1. Harga sudah termasuk (Flightcase ABS, Cabling, Clamp dan sparepart 2%)',
      '2. Harga belum termasuk Video Processor',
      '3. Harga FOB pengiriman dari Jakarta dan Surabaya'
    ],
    comparisonChart: '/images/products/qiangli-comparison-chart.png'
  },
  mvg_rental_fabulux: {
    bannerTitle: 'PRICE LIST PRODUK LED RENTAL /METER PERSEGI',
    bannerSubtitle: 'Katalog Resmi Fabulux Rental Series Mitra Visual Group (MVG)',
    bannerImage: '/images/products/fabulux-banner.png',
    kursUSD: 'Rp18.064',
    notes: [
      '1. Harga sudah termasuk (Flightcase ABS, Cabling, Clamp dan sparepart 2%)',
      '2. Harga belum termasuk Video Prosesor Colorlight / Novastar',
      '3. Harga FOB pengiriman dari Jakarta dan Surabaya'
    ]
  },
  mvg_rental_maven: {
    bannerTitle: 'PRICE LIST PRODUK LED RENTAL /METER PERSEGI',
    bannerSubtitle: 'Katalog Resmi Unilumin Lampro Maven & LRS Rental Series MVG',
    bannerImage: '/images/products/unilumin-banner.png',
    kursUSD: 'Rp18.068',
    notes: [
      '1. Harga sudah termasuk (Fligthcase ABS, Cabeling, Clamp dan sparepart 2%)',
      '2. Harga belum termasuk Video Prosesor',
      '3. Harga FOB pengirman dari Jakarta dan Surabaya'
    ]
  },
  mvg_moka_effect: {
    bannerTitle: 'PRICE LIST PRODUK MOKA SFX & SPECIAL EFFECTS',
    bannerSubtitle: 'Katalog Efek Panggung CO2 Cannon, Double Jet, Cold Sparkle & Flame MVG',
    bannerImage: '/images/products/moka-banner.png',
    kursUSD: '*Harga Mengikuti Kurs $ USD',
    notes: [
      '1. Website resmi: www.mokalighting.com (Distributor Resmi Indonesia)',
      '2. Tersedia link video demonstrasi demo Youtube untuk setiap unit produk',
      '3. Garansi sparepart & dukungan servis resmi Mitra Visual Group'
    ]
  },
  mvg_mode_hoist: {
    bannerTitle: 'PRICE LIST MODE HOIST RIGGING & MOTOR STAGING',
    bannerSubtitle: 'Katalog Electric Hoist 1T/2T, Battery Free Hoist & Group Controller MVG',
    bannerImage: '/images/products/mode-banner.png',
    kursUSD: '*Harga Mengikuti Kurs $ USD',
    notes: [
      '1. Harga sudah termasuk Flight Case & Double Brake (Dual Braking System)',
      '2. Power supply standar 380V / 3 Phase / 50Hz & Black Load Chain 20m - 25m',
      '3. Tersedia Controller 8CH dengan kontrol Wired & Wireless Remote'
    ]
  },
  mvg_meanreal_lighting: {
    bannerTitle: 'MEANREAL PROFESSIONAL STAGE LIGHTING & CONSOLE',
    bannerSubtitle: 'Katalog Moving Head BSW 550, Super Beam, ALED, Follow Spot & Lighting Console',
    bannerImage: '/images/products/meanreal-banner.png',
    kursUSD: '*Harga Mengikuti Kurs $ USD',
    notes: [
      '1. Free: High Quality Flightcase 2 in 1 & Folding Clamp untuk Moving Head',
      '2. Lampu original Philips MSD Platinum / Osram Sirius HRI umur hingga 4000 jam',
      '3. Katalog mencakup Moving Head BSW, Beam, Follow Spot, GrandMA & Midas Console'
    ]
  },
  mvg_alumino: {
    bannerTitle: 'ALUMINO RIGGING TRUSS 6082-T6 & STAGING SYSTEM',
    bannerSubtitle: 'Katalog Bolt Truss 300/400/450/600, Box Connector, Sleeve Block & Stage Stand',
    bannerImage: '/images/products/alumino-banner.png',
    kursUSD: 'Alloy 6082-T6',
    notes: [
      '1. Material: Aluminum Alloy 6082-T6 standar internasional rigging & trussing',
      '2. Pengelasan robotic otomatis presisi (Fully Automated Data Welding)',
      '3. Kantor resmi Jakarta (Ruko Megaboulevard Harapan Indah Bekasi) & pengiriman nasional'
    ]
  },
  mvg_ringlock: {
    bannerTitle: 'PRICE LIST RINGLOCK SCAFFOLDING GALVANIS Q335',
    bannerSubtitle: 'Katalog Scaffolding Standar Internasional Paket Komplit 2x2x2m & Eceran MVG',
    bannerImage: '/images/products/ringlock-banner.png',
    comparisonChart: '/images/products/ringlock/ringlock-structure-diagram.png',
    kursUSD: 'Galvanis Q335',
    notes: [
      '1. Material: Iron Q335 Hot-Dip Galvanizing anti karat & cuaca ekstrem',
      '2. Tersedia Paket Komplit Scaffolding 2x2x2m & komponen eceran resmi',
      '3. Sistem penguncian rosette 8-arah presisi tinggi, kokoh & cepat dirakit'
    ]
  },
  mvg_gaga_laser: {
    bannerTitle: 'GAGA RGB LASER STAGE LIGHT FOR PROFESSIONAL EVENT',
    bannerSubtitle: 'Katalog Laser RGB 3W - 40W Waterproof & Pangolin Quickshow FB3/FB4 ILDA',
    bannerImage: '/images/products/gaga-banner.png',
    kursUSD: '*Harga Mengikuti Kurs $ USD',
    notes: [
      '1. Garansi resmi profesional event laser & software Pangolin QuickShow Original (Dongle)',
      '2. Showroom Demo tersedia di Jakarta (Harapan Indah Bekasi) & Surabaya (Jl. Kuwukan)',
      '3. Dukungan kontrol ILDA, DMX-512, LCD Display & sertifikasi Waterproof IP65'
    ]
  },
  mvg_mojo_barrier: {
    bannerTitle: 'ALUMINUM MOJO CROWD CONTROL BARRIER QUICK LOCK',
    bannerSubtitle: 'Katalog Pembatas Penonton Konser & Event Aluminium Heavy-Duty MVG',
    bannerImage: '/images/products/mojo-banner.png',
    kursUSD: 'Alloy 6082-T6',
    notes: [
      '1. Material: Aluminum Alloy 6082-T6 Quick Lock System tahan beban tinggi',
      '2. Dilengkapi pedal anti-slip footplate untuk kestabilan crowd control event',
      '3. Tersedia tipe Straight 1m, Corner 90-270°, dan Door Gate akses darurat'
    ]
  },
  mvg_aksesoris_rental: {
    bannerTitle: 'AKSESORIS & POWER DISTRIBUTION VIDEOTRON RENTAL',
    bannerSubtitle: 'Katalog Panel Listrik 3-Phase, PowerCON, Cat6, Clamps & Armored Fiber Optic',
    bannerImage: '/images/products/aksesoris-banner.png',
    kursUSD: 'RoHS Compliant',
    notes: [
      '1. Power Distribution Panel 3-Phase dilengkapi MCB individual & digital meter',
      '2. Kabel PowerCON, Cat6 UTP, dan Fiber Optic standar RoHS compliant',
      '3. Flightcase ABS shockproof melindungi modul & kabinet saat mobilitas rental'
    ]
  },
  mvg_instalasi_led: {
    bannerTitle: 'PRICE LIST PAKET INSTALASI LED VIDEOTRON',
    bannerSubtitle: 'Katalog Resmi Paket Instalasi Modular & Cabinet QiangLi & ABSEN Mitra Visual Group (MVG)',
    bannerImage: '/images/products/instalasi-led-banner.svg',
    kursUSD: 'Paket Siap Pasang',
    notes: [
      '1. Tersedia pilihan sistem pemasangan Modular (Besi Hollo/Struktur) dan Cabinet Diecast / Iron',
      '2. Mencakup varian Indoor, Outdoor, GOB Protective, Flexible & COB Pro Series',
      '3. Garansi resmi panel modul, receiving card, power supply dan purna jual Mitra Visual Group'
    ]
  },

  // AV Categories
  qiangli: {
    bannerTitle: 'MODUL LED VIDEOTRON QIANGLI PRO SERIES',
    bannerSubtitle: 'Katalog Resmi Modul LED Videotron QiangLi Indoor, Outdoor & Flexible',
    kursUSD: 'High Refresh 7680Hz',
    notes: [
      '1. Modul original pabrik QiangLi High Refresh Rate 7680Hz',
      '2. Ukuran standar 320x160mm Indoor, Outdoor & Soft Flexible Series',
      '3. Dukungan setting file RCFG & konfigurasi profesional'
    ]
  },
  lampro: {
    bannerTitle: 'MODUL LED VIDEOTRON LAMPRO PRO SERIES',
    bannerSubtitle: 'Katalog Resmi Modul LED Videotron Lampro Indoor & Outdoor Pro Series',
    kursUSD: 'High Refresh 7680Hz',
    notes: [
      '1. Modul LED original pabrik Lampro (Unilumin Group) Refresh 7680Hz',
      '2. Kualitas warna prima & kestabilan chip driver PWM presisi',
      '3. Tersedia seri Indoor P1.5 s/d P4 dan Outdoor P2.5 s/d P5'
    ]
  },
  huidu: {
    bannerTitle: 'HUIDU CONTROLLER & VIDEO PROCESSOR',
    bannerSubtitle: 'Katalog Huidu HD-A3L, HD-A4L, HD-VP Series & Media Player Display',
    kursUSD: 'Original Huidu',
    notes: [
      '1. Controller & Video Processor Huidu original bersertifikasi',
      '2. Mendukung pemutaran asinkron & sinkron via LAN, Wi-Fi, Cloud & HDMI',
      '3. Kompatibel penuh dengan seluruh merk modul LED standar HUB75'
    ]
  },
  colorlight: {
    bannerTitle: 'COLORLIGHT RECEIVING CARDS & PROCESSORS',
    bannerSubtitle: 'Katalog Kartu Penerima Colorlight 5A-75B/E, i5 & Video Processor X-Series',
    kursUSD: 'Original Colorlight',
    notes: [
      '1. Kartu penerima (Receiving Card) & Processor Colorlight original resmi',
      '2. Dukungan kalibrasi warna tingkat lanjut & low latency synchronization',
      '3. Pilihan populer: 5A-75B, 5A-75E, i5, E80, E120 & Multimedia Player A35/A60'
    ]
  },
  novastar: {
    bannerTitle: 'NOVASTAR CONTROLLER, SENDING & RECEIVING CARDS',
    bannerSubtitle: 'Katalog Resmi NovaStar Video Processor VX-Series, DH-Series & Taurus Player',
    kursUSD: 'Original NovaStar',
    notes: [
      '1. Produk 100% Original NovaStar bergaransi distributor resmi',
      '2. All-in-one Video Controller: VX400 (4 port), VX600 (6 port), VX1000 (10 port)',
      '3. Receiving Card: DH7508, DH7512-S & Multimedia Taurus TB-Series'
    ]
  },
  cabinet: {
    bannerTitle: 'CABINET VIDEOTRON DIE-CAST ALUMINIUM & IRON',
    bannerSubtitle: 'Katalog Kabinet Videotron Die-Cast Aluminium Rental & Besi Outdoor Waterproof',
    kursUSD: 'Die-Cast & Iron',
    notes: [
      '1. Cabinet Die-Cast Aluminium presisi tinggi untuk rental & instalasi tetap',
      '2. Cabinet Iron Waterproof outdoor tahan cuaca ekstrem lengkap dengan kipas & PSU plate',
      '3. Tersedia ukuran 500x500mm, 500x1000mm, 960x960mm & custom size'
    ]
  },
  psu: {
    bannerTitle: 'POWER SUPPLY (PSU) VIDEOTRON 200W - 400W',
    bannerSubtitle: 'Katalog Power Supply 5V/4.5V Lampro, Meanwell Ultra Slim & G-Energy',
    bannerImage: '/images/products/psu-banner.png',
    kursUSD: '5V / 4.5V Output',
    notes: [
      '1. Power Supply efisiensi tinggi standar videotron 5V / 4.5V output stabil',
      '2. Proteksi lengkap: Overload, Short-Circuit, Over-Voltage & Thermal Cutoff',
      '3. Merk terpercaya: Lampro LD-series, Leyard, Meanwell & G-Energy 200W - 400W'
    ]
  },
  led_poster: {
    bannerTitle: 'LED POSTER DISPLAY FLAT & FOLDABLE SERIES',
    bannerSubtitle: 'Katalog LED Poster 640x1920mm Plug & Play Mobile Display AV & MVG - Rincian Lengkap BOM & Costing',
    kursUSD: 'Include A35 Player • BOM 24 Modul (Margin 25%)',
    notes: [
      '1. Ukuran standar display 640 x 1920 mm (24 Modul 320x160mm) dengan frame aluminium & kabinet besi presisi',
      '2. Tersedia model Flat (kaki roda mobile) dan Foldable (engsel lipat portable memudahkan transportasi)',
      '3. Rincian BOM resmi pabrikan: 24 Modul LED, Kabinet Besi Flat/Foldable, 4-8 PSU, 2-4 Receiving Card, Kabel Jumper & Power, Biaya Rakit Rp270.000, dan Processor Colorlight A35 Player Rp1.786.423 (Target Profit Margin 25%)',
      '4. Sistem siap pakai Plug & Play dengan software CMS Colorlight via Wi-Fi, LAN, USB, dan Cloud'
    ]
  },
  led_cube: {
    bannerTitle: 'LED CUBE 32x32CM 4-SISI & 5-SISI DISPLAY',
    bannerSubtitle: 'Katalog Kubus LED Kreatif 32x32cm Indoor & Outdoor Seamless Rakitan Siap Pakai',
    kursUSD: '32x32x32cm',
    notes: [
      '1. Dimensi kubus 32 x 32 x 32 cm dengan sudut sambungan seamless presisi',
      '2. Tersedia varian 4-Sisi (gantung / dinding) dan 5-Sisi (berdiri 360° display)',
      '3. Paket sudah termasuk modul LED, kabinet besi, PSU, receiving card & rakitan siap pakai'
    ]
  },
  magnustek_tkdn: {
    bannerTitle: 'LED VIDEOTRON MAGNUSTEK BERSERTIFIKAT RESMI TKDN',
    bannerSubtitle: 'Katalog Videotron TKDN Kemenperin RI COB & SMD Indoor / Outdoor Kualitas Nasional',
    kursUSD: 'TKDN s/d 42.82%',
    notes: [
      '1. Bersertifikat Resmi TKDN Kemenperin RI dengan nilai hingga 42.82%',
      '2. Memenuhi standar pengadaan e-Katalog LKPP instansi pemerintah & BUMN',
      '3. Tersedia teknologi mutakhir COB Ultra-Fine Pitch P0.9 - P1.5 dan SMD Outdoor'
    ]
  },
  finished_cabinet: {
    bannerTitle: 'FINISHED CABINET VIDEOTRON SIAP PAKAI',
    bannerSubtitle: 'Katalog Kabinet Jadi Die-Cast Aluminium, Iron Outdoor, Curve, Corner & COB Mitra Visual Group (AV)',
    bannerImage: '/images/products/finished-cabinet-banner.svg',
    kursUSD: 'Kabinet Siap Rakit',
    notes: [
      '1. Finished Cabinet siap pakai mencakup modul, kabinet presisi, dan mounting hardware',
      '2. Tersedia pilihan Die-Cast Aluminium 64x48cm, 64x64cm, 96x96cm & Iron Outdoor Waterproof',
      '3. Varian khusus: Iron Curve 112x96cm, Iron Corner (32+64)x96cm, Transparent & COB 600x337.5mm'
    ]
  },
  mvg_finished_cabinet: {
    bannerTitle: 'FINISHED CABINET VIDEOTRON SIAP PAKAI',
    bannerSubtitle: 'Katalog Kabinet Jadi Die-Cast Aluminium, Iron Outdoor, Curve, Corner & COB Mitra Visual Group',
    bannerImage: '/images/products/finished-cabinet-banner.svg',
    kursUSD: 'Kabinet Siap Rakit',
    notes: [
      '1. Finished Cabinet siap pakai mencakup modul, kabinet presisi, dan mounting hardware',
      '2. Tersedia pilihan Die-Cast Aluminium 64x48cm, 64x64cm, 96x96cm & Iron Outdoor Waterproof',
      '3. Varian khusus: Iron Curve 112x96cm, Iron Corner (32+64)x96cm, Transparent & COB 600x337.5mm'
    ]
  }
}

export interface StoreState {
  itemsByCategory: Record<string, PricelistItem[]>
  categoryExtra: Record<string, CategoryExtra>
  previousPrices: Record<string, number>
  lastSync: string
  contentHash: string
  isFetching: boolean
}

const store: StoreState = {
  itemsByCategory: {},
  categoryExtra: { ...DEFAULT_CATEGORY_EXTRA },
  previousPrices: loadPersistentBaseline(),
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


const MOKA_IMAGES: Record<string, string> = {
  'sfx-moka-2cm-5m-24pcs': '/images/products/moka/sfx-moka-2cm-5m-24pcs.jpg',
  'sfx-moka-bt-10w-flight-case': '/images/products/moka/sfx-moka-bt-10w-flight-case.jpg',
  'sfx-moka-bubble-liquid': '/images/products/moka/sfx-moka-bubble-liquid.jpg',
  'sfx-moka-h-c01': '/images/products/moka/sfx-moka-h-c01.jpg',
  'sfx-moka-h-c03': '/images/products/moka/sfx-moka-h-c03.webp',
  'sfx-moka-h-c04': '/images/products/moka/sfx-moka-h-c04.jpg',
  'sfx-moka-h-c06': '/images/products/moka/sfx-moka-h-c06.jpg',
  'sfx-moka-h-c08': '/images/products/moka/sfx-moka-h-c08.jpg',
  'sfx-moka-h-d4000': '/images/products/moka/sfx-moka-h-d4000.jpg',
  'sfx-moka-h-e01': '/images/products/moka/sfx-moka-h-e01.webp',
  'sfx-moka-h-e01a': '/images/products/moka/sfx-moka-h-e01a.jpg',
  'sfx-moka-h-e03': '/images/products/moka/sfx-moka-h-e03.webp',
  'sfx-moka-h-e04': '/images/products/moka/sfx-moka-h-e04.webp',
  'sfx-moka-h-f01': '/images/products/moka/sfx-moka-h-f01.webp',
  'sfx-moka-h-f02': '/images/products/moka/sfx-moka-h-f02.jpg',
  'sfx-moka-h-s03': '/images/products/moka/sfx-moka-h-s03.jpg',
  'sfx-moka-h-s04': '/images/products/moka/sfx-moka-h-s04.jpg',
  'sfx-moka-h-s06': '/images/products/moka/sfx-moka-h-s06.jpg',
  'sfx-moka-haze-liquid-oil-base': '/images/products/moka/sfx-moka-haze-liquid-oil-base.webp',
  'sfx-moka-low-fog-liquid': '/images/products/moka/sfx-moka-low-fog-liquid.webp',
  'sfx-moka-metallic-confetti-golden': '/images/products/moka/sfx-moka-metallic-confetti-golden.jpg',
  'sfx-moka-metallic-confetti-silver': '/images/products/moka/sfx-moka-metallic-confetti-silver.jpg',
  'sfx-moka-mini-10w-flight-case': '/images/products/moka/sfx-moka-mini-10w-flight-case.jpg',
  'sfx-moka-mini-console-4way': '/images/products/moka/sfx-moka-mini-console-4way.jpg',
  'sfx-moka-mk-11a': '/images/products/moka/sfx-moka-mk-11a.webp',
  'sfx-moka-mk-80cm': '/images/products/moka/sfx-moka-mk-80cm.webp',
  'sfx-moka-mk-b12': '/images/products/moka/sfx-moka-mk-b12.jpg',
  'sfx-moka-mk-b13': '/images/products/moka/sfx-moka-mk-b13.jpg',
  'sfx-moka-mk-b16': '/images/products/moka/sfx-moka-mk-b16.jpg',
  'sfx-moka-mk-c05': '/images/products/moka/sfx-moka-mk-c05.jpg',
  'sfx-moka-mk-c07': '/images/products/moka/sfx-moka-mk-c07.webp',
  'sfx-moka-mk-c09': '/images/products/moka/sfx-moka-mk-c09.webp',
  'sfx-moka-mk-c10a': '/images/products/moka/sfx-moka-mk-c10a.jpg',
  'sfx-moka-mk-c12': '/images/products/moka/sfx-moka-mk-c12.webp',
  'sfx-moka-mk-c14': '/images/products/moka/sfx-moka-mk-c14.webp',
  'sfx-moka-mk-cmp1': '/images/products/moka/sfx-moka-mk-cmp1.jpg',
  'sfx-moka-mk-cn02': '/images/products/moka/sfx-moka-mk-cn02.jpg',
  'sfx-moka-mk-cn03': '/images/products/moka/sfx-moka-mk-cn03.webp',
  'sfx-moka-mk-cn04': '/images/products/moka/sfx-moka-mk-cn04.webp',
  'sfx-moka-mk-cn05a': '/images/products/moka/sfx-moka-mk-cn05a.webp',
  'sfx-moka-mk-cn06a': '/images/products/moka/sfx-moka-mk-cn06a.jpg',
  'sfx-moka-mk-cn11': '/images/products/moka/sfx-moka-mk-cn11.jpg',
  'sfx-moka-mk-cn13': '/images/products/moka/sfx-moka-mk-cn13.jpg',
  'sfx-moka-mk-cn16': '/images/products/moka/sfx-moka-mk-cn16.jpg',
  'sfx-moka-mk-cn18': '/images/products/moka/sfx-moka-mk-cn18.jpg',
  'sfx-moka-mk-cs23': '/images/products/moka/sfx-moka-mk-cs23.jpg',
  'sfx-moka-mk-e15': '/images/products/moka/sfx-moka-mk-e15.jpg',
  'sfx-moka-mk-e18': '/images/products/moka/sfx-moka-mk-e18.webp',
  'sfx-moka-mk-e22': '/images/products/moka/sfx-moka-mk-e22.jpg',
  'sfx-moka-mk-e25': '/images/products/moka/sfx-moka-mk-e25.jpg',
  'sfx-moka-mk-e26': '/images/products/moka/sfx-moka-mk-e26.jpg',
  'sfx-moka-mk-e27': '/images/products/moka/sfx-moka-mk-e27.jpg',
  'sfx-moka-mk-e29': '/images/products/moka/sfx-moka-mk-e29.webp',
  'sfx-moka-mk-f01': '/images/products/moka/sfx-moka-mk-f01.webp',
  'sfx-moka-mk-f02': '/images/products/moka/sfx-moka-mk-f02.jpg',
  'sfx-moka-mk-f05': '/images/products/moka/sfx-moka-mk-f05.webp',
  'sfx-moka-mk-f07': '/images/products/moka/sfx-moka-mk-f07.webp',
  'sfx-moka-mk-f11': '/images/products/moka/sfx-moka-mk-f11.jpg',
  'sfx-moka-mk-f11a': '/images/products/moka/sfx-moka-mk-f11a.webp',
  'sfx-moka-mk-f12': '/images/products/moka/sfx-moka-mk-f12.webp',
  'sfx-moka-mk-f13': '/images/products/moka/sfx-moka-mk-f13.jpg',
  'sfx-moka-mk-f14a': '/images/products/moka/sfx-moka-mk-f14a.webp',
  'sfx-moka-mk-f18a': '/images/products/moka/sfx-moka-mk-f18a.jpg',
  'sfx-moka-mk-f20': '/images/products/moka/sfx-moka-mk-f20.webp',
  'sfx-moka-mk-f23': '/images/products/moka/sfx-moka-mk-f23.webp',
  'sfx-moka-mk-f24': '/images/products/moka/sfx-moka-mk-f24.webp',
  'sfx-moka-mk-lsp20': '/images/products/moka/sfx-moka-mk-lsp20.jpg',
  'sfx-moka-pf-1800': '/images/products/moka/sfx-moka-pf-1800.webp',
  'sfx-moka-pf-800': '/images/products/moka/sfx-moka-pf-800.jpg',
  'sfx-moka-powder-100bags-outdoor': '/images/products/moka/sfx-moka-powder-100bags-outdoor.jpg',
  'sfx-moka-pro-morning-haze-liquid': '/images/products/moka/sfx-moka-pro-morning-haze-liquid.webp',
  'sfx-moka-quick-smoke-liquid': '/images/products/moka/sfx-moka-quick-smoke-liquid.jpg',
  'sfx-moka-red-power-button': '/images/products/moka/sfx-moka-red-power-button.jpg',
  'sfx-moka-slowfall-confetti-multicolor': '/images/products/moka/sfx-moka-slowfall-confetti-multicolor.jpg',
  'sfx-moka-smoke-liquid-4l': '/images/products/moka/sfx-moka-smoke-liquid-4l.jpg',
  'sfx-moka-snow-liquid': '/images/products/moka/sfx-moka-snow-liquid.jpg',
}

const HOIST_LINKS: Record<string, string> = {
  '1': 'https://drive.google.com/file/d/1oPSIiU2h_ZGvTeagTMDn-dSgoWR6fNYf/view?usp=drive_link',
  '2': 'https://drive.google.com/file/d/1Khh6j-Oax6XYF4Oimvuob9uRzY8MIO7F/view?usp=drive_link',
  '3': 'https://drive.google.com/file/d/1DCm1vEysA8EUMeKu-VOXwGGxc_OgOiOB/view?usp=sharing',
  '4': 'https://drive.google.com/file/d/1DCm1vEysA8EUMeKu-VOXwGGxc_OgOiOB/view?usp=sharing'
}

const GAGA_LINKS: Record<string, string> = {
  '1': 'https://www.youtube.com/watch?v=kvvOSWMVQtE',
  '2': 'https://www.youtube.com/watch?v=qIjlsvPUjXY&t=9s',
  '3': 'https://www.youtube.com/watch?v=8peSsMWr_s0',
  '4': 'https://www.youtube.com/watch?v=B9NFKUUJnCE',
  '5': 'https://www.youtube.com/watch?v=AKVgapxwS7M',
  '6': 'https://www.youtube.com/watch?v=B9NFKUUJnCE&t=13s',
  '7': 'https://www.youtube.com/watch?v=TQsJbQ6t5Z0',
  '8': 'https://www.youtube.com/watch?v=nVYV65r8_gw',
  '9': 'https://www.youtube.com/watch?v=5RpABh9sti4&list=PLYN8RZ0FldXG1hFgAC8IBHlUTCqBeUtPu',
  '10': 'https://www.youtube.com/watch?v=_7WHBK23QdA'
}

const MEANREAL_LINKS: Record<string, string> = {
  'bsw 550': 'https://drive.google.com/file/d/1jdYF-20mwdBXkzn8aAdzwbzvU4IZIdZY/view?usp=drive_link',
  'bsw 480': 'https://drive.google.com/drive/folders/1h_eTUtfEV9VXkdu6-hydqh15MP4KQt5o?usp=drive_link',
  'bsw 380': 'https://drive.google.com/drive/folders/1pRAk1kcbWRcxsRhQDpmBcM6ftU-3c36U?usp=drive_link',
  'super beam 480': 'https://drive.google.com/drive/folders/1fqDKCQ98G6ZhioDy-kkjOJiqzHaDEdIy?usp=drive_link',
  'super beam 420': 'https://drive.google.com/open?id=1f-KdrKVXNfGhEy_Y-C3k0H1UzX9Bs_sB',
  'super beam 380': 'https://drive.google.com/drive/folders/1PEzvJBL7I8wzRXwn2r32d6_7bBEkjrko?usp=drive_link',
  'super beam 300': 'https://drive.google.com/drive/folders/1mEj4HdKj2BF6GjYzjZ3mYBBphQn1RXC7?usp=drive_link',
  'aled bsw 480': 'https://drive.google.com/drive/folders/1lgsNdTaxjIeIsMKv_-Mu3sD-CAn1nryH?usp=drive_link',
  'aled bsw 400': 'https://drive.google.com/drive/folders/1ooGcqqWevwELg2G77opi_9NVF5WeX6BI?usp=drive_link',
  'b-eye k10': 'https://drive.google.com/drive/folders/1-y10yOC7CBTnK6zC6os-pgWwulyE_UV2?usp=drive_link',
  'b-eye k15': 'https://drive.google.com/drive/folders/1D6Nydxu0C6fGRIdR8XtcHg70Ch2OZCdP?usp=drive_link',
  'b-eye k25': 'https://drive.google.com/open?id=1MAeiuCypspsIHUCkQX7v94Zaenf849Ka'
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

      // Parse Kurs USD & Notes dynamically from sheet
      let kursUSD = ''
      const notes: string[] = []
      let headerIdx = -1

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const rowText = r.join(' ')
        if (rowText.includes('KURS')) {
          for (const cell of r) {
            if (cell && (cell.includes('Rp') || /[\d.,]{4,}/.test(cell))) {
              kursUSD = cell.trim()
            }
          }
        }
        if (
          r.some((c) => (c || '').trim().toUpperCase() === 'NO') &&
          r.some(
            (c) =>
              (c || '').trim().toUpperCase().includes('BRAND') ||
              (c || '').trim().toUpperCase().includes('TYPE')
          )
        ) {
          headerIdx = i
        }
        const firstCell = (r[0] || '').trim()
        if (
          firstCell.startsWith('1.') ||
          firstCell.startsWith('2.') ||
          firstCell.startsWith('3.')
        ) {
          notes.push(firstCell)
        }
      }

      const defaultExtra = DEFAULT_CATEGORY_EXTRA[categoryId] || {}
      store.categoryExtra[categoryId] = {
        ...defaultExtra,
        kursUSD: kursUSD || defaultExtra.kursUSD || 'Rp18.062',
        notes: notes.length > 0 ? notes : (defaultExtra.notes || [])
      }

      const startIdx = headerIdx >= 0 ? headerIdx + 1 : 2
      let itemSeq = 0

      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        if (noVal.toLowerCase().startsWith('note') || !/^\d+$/.test(noVal)) continue
        itemSeq++

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

        let displayDesc =
          desc ||
          `${brand} ${rawType} ${size ? 'Size: ' + size : ''} ${
            curve ? 'Curve: ' + curve : ''
          }`.trim()

        if (categoryId === 'mvg_rental_fabulux') {
          const brandLower = brand.toLowerCase()
          const typeLower = rawType.toLowerCase()

          let lampTag = ''
          if (brandLower.includes('white lamp')) lampTag = '(White Lamp)'
          else if (brandLower.includes('black lamp')) lampTag = '(Black Lamp)'
          else if (brandLower.includes('4in1')) lampTag = '(4in1 Lamp)'

          if (typeLower.includes('hanging') || typeLower.includes('base')) {
            model = `Fabulux ${rawType} (${size})`
            displayDesc = `Fabulux 2 in 1 Hanging Beam Bar & Ground Support Base Length: ${size}`
          } else {
            model = `Fabulux ${lampTag ? lampTag + ' ' : ''}${rawType} (${size})`.trim()
            if (typeLower.includes('vr corner')) {
              displayDesc = `Fabulux ${rawType} ${lampTag} Curve 90° Seamless Corner Size: ${size}`
            } else if (typeLower.includes('master plus')) {
              displayDesc = `Fabulux ${rawType} ${lampTag} Curve Rental Cabinet Size: ${size}`
            } else if (typeLower.includes('alpha')) {
              displayDesc = `Fabulux ${rawType} IMD 4in1 Lamp High Definition Indoor Rental Size: ${size}`
            } else if (typeLower.includes('spider max')) {
              displayDesc = `Fabulux ${rawType} Lightweight Indoor Rental Curve Cabinet Size: ${size}`
            }
          }
        } else if (categoryId === 'mvg_rental_maven') {
          const typeLower = rawType.toLowerCase()

          model = `Unilumin Lampro ${rawType} (${size})`
          if (typeLower.includes('maven')) {
            displayDesc = `Unilumin Lampro Maven P3.9 Outdoor Flat Rental Cabinet Size: ${size}`
          } else if (typeLower.includes('e-corner')) {
            displayDesc = `Unilumin Lampro LRS P2.6 Indoor Curve 90° Seamless Corner Size: ${size}`
          } else {
            displayDesc = `Unilumin Lampro LRS P2.6 Indoor High Refresh Rate Curve Cabinet Size: ${size}`
          }
        }

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
        const sku = `${prefix}-${itemSeq}`

        // Image & brochure mapping
        let productImage: string | undefined = undefined
        let brochureUrl: string | undefined = undefined

        if (categoryId === 'mvg_rental_qiangli') {
          const typeLower = rawType.toLowerCase()
          if (typeLower.includes('floor')) {
            productImage = '/images/products/qiangli-led-floor.png'
          } else if (typeLower.includes('mavic xt')) {
            productImage = '/images/products/qiangli-mavic-xt-transparant.png'
            brochureUrl = 'https://drive.google.com/file/d/1bxcHQUYLFK1MzYy6BEB6m226_fIf9juE/view?usp=drive_link'
          } else if (typeLower.includes('cosmo')) {
            productImage = '/images/products/qiangli-cosmo-transparant.png'
            brochureUrl = 'https://drive.google.com/file/d/1l3genAqoz9Qjo0DGihmraXAxmswpsR7a/view?usp=drive_link'
          } else if (typeLower.includes('saga') && typeLower.includes('indoor')) {
            productImage = '/images/products/qiangli-saga-indoor.png'
            brochureUrl = 'https://drive.google.com/file/d/1MFp2nUvCdZAoqKqysbDE703Muqu5sEaR/view?usp=drive_link'
          } else if (typeLower.includes('saga')) {
            productImage = '/images/products/qiangli-saga-outdoor.png'
            brochureUrl = 'https://drive.google.com/file/d/1pBxplC-okM6trksZDr3z07nEez9wlJ2W/view?usp=drive_link'
          } else if (typeLower.includes('lite') && typeLower.includes('indoor')) {
            productImage = '/images/products/qiangli-new-lite-indoor.png'
          } else if (typeLower.includes('lite')) {
            productImage = '/images/products/qiangli-new-lite-outdoor.png'
            brochureUrl = 'https://drive.google.com/file/d/1VB7kjARlwhD4JX956RJdPCgAErrJpPV8/view?usp=drive_link'
          } else if (typeLower.includes('mavic')) {
            productImage = '/images/products/qiangli-mavic.png'
            brochureUrl = 'https://drive.google.com/file/d/1I6rp6EcgMZig01zL5m0IxeqyvFBfEM9O/view?usp=sharing'
          }
        } else if (categoryId === 'mvg_rental_fabulux') {
          const brandLower = brand.toLowerCase()
          const typeLower = rawType.toLowerCase()

          if (brandLower.includes('white lamp')) {
            productImage = '/images/products/fabulux-master-plus-white.png'
            brochureUrl = 'https://drive.google.com/file/d/1ZZwDyEdpidGwDsyQMO9wL16DNelr_adH/view?usp=drive_link'
          } else if (brandLower.includes('black lamp')) {
            productImage = '/images/products/fabulux-master-plus-black.png'
            brochureUrl = 'https://drive.google.com/file/d/1ZZwDyEdpidGwDsyQMO9wL16DNelr_adH/view?usp=drive_link'
          } else if (typeLower.includes('alpha') || brandLower.includes('4in1')) {
            productImage = '/images/products/fabulux-alpha-indoor.png'
            brochureUrl = 'https://drive.google.com/file/d/1vZei59qgFOxooOqKxyGY6kKnwiguCK6S/view?usp=drive_link'
          } else if (typeLower.includes('spider')) {
            productImage = '/images/products/fabulux-spider-max.png'
            brochureUrl = 'https://drive.google.com/file/d/1N2wMOUfsXdRHqwCj0kUMFcxE_fsSTr22/view?usp=drive_link'
          } else if (typeLower.includes('hanging') || typeLower.includes('base')) {
            productImage = '/images/products/fabulux-hanging-bar.png'
            brochureUrl = undefined
          } else {
            productImage = '/images/products/fabulux-master-plus-white.png'
            brochureUrl = 'https://drive.google.com/file/d/1ZZwDyEdpidGwDsyQMO9wL16DNelr_adH/view?usp=drive_link'
          }
        } else if (categoryId === 'mvg_rental_maven') {
          const typeLower = rawType.toLowerCase()
          if (typeLower.includes('lrs') || typeLower.includes('e-corner')) {
            productImage = '/images/products/unilumin-lrs-p26.png'
            brochureUrl = 'https://drive.google.com/file/d/1wnannEXIUkW3_7NoYR-JLaPST505yjpz/view?usp=drive_link'
          } else {
            productImage = '/images/products/maven-p39-outdoor.png'
            brochureUrl = 'https://drive.google.com/file/d/1M7gDilXYAz21m1xrPitLxgzwfeepOpuj/view?usp=drive_link'
          }
        }

        items.push({
          id: `${categoryId}-${itemSeq}`,
          no: itemSeq,
          category: categoryId,
          catalog: 'mvg',
          model,
          type: typeBadge,
          description: displayDesc,
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: productImage,
          brochureUrl,
          metadata: {
            hargaCash,
            hargaCashFormatted: formatRupiah(hargaCash),
            hargaKredit,
            hargaKreditFormatted: formatRupiah(hargaKredit),
            curve,
            size,
            brand,
            no: itemSeq
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
      let seq = 0
      for (let i = 2; i < rows.length; i++) {
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
        seq++

        const skuKey = sku.toLowerCase()
        const codeKey = code ? `sfx-moka-${code.toLowerCase()}` : ''
        const productImage = MOKA_IMAGES[skuKey] || MOKA_IMAGES[codeKey] || '/images/products/moka/sfx-moka-mk-c09.webp'

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model: title || `MOKA ${code}`,
          type: cat,
          description: desc || title,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: productImage,
          brochureUrl: (link && (link.startsWith('http://') || link.startsWith('https://'))) ? link : undefined,
          videoUrl: link || undefined,
          metadata: {
            code,
            videoUrl: link,
            no: seq
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
      let seq = 0
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        if (!/^\d+$/.test(noVal)) continue
        seq++
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

        // Map exact photos from the spreadsheet (including multiple angle pictures)
        let productImage = '/images/products/hoist/hoist-electric-unit.png'
        let productImages: string[] = []

        if (noVal === '1' || noVal === '2') {
          // Electric Hoist 611 1T / 2T (3 pictures)
          productImage = '/images/products/hoist/hoist-electric-unit.png'
          productImages = [
            '/images/products/hoist/hoist-electric-unit.png',
            '/images/products/hoist/hoist-electric-case.png',
            '/images/products/hoist/hoist-electric-chain.png'
          ]
        } else if (noVal === '3' || noVal === '4') {
          // Battery / Free Hoist 1T (3 pictures)
          productImage = '/images/products/hoist/hoist-battery-unit.png'
          productImages = [
            '/images/products/hoist/hoist-battery-unit.png',
            '/images/products/hoist/hoist-battery-pack.png',
            '/images/products/hoist/hoist-battery-case.png'
          ]
        } else if (noVal === '5') {
          // Manual Hoist 1T (3 pictures)
          productImage = '/images/products/hoist/hoist-manual-unit-1t.png'
          productImages = [
            '/images/products/hoist/hoist-manual-unit-1t.png',
            '/images/products/hoist/hoist-manual-chain.png',
            '/images/products/hoist/hoist-manual-case.png'
          ]
        } else if (noVal === '6') {
          // Manual Hoist 2T (3 pictures)
          productImage = '/images/products/hoist/hoist-manual-unit-2t.png'
          productImages = [
            '/images/products/hoist/hoist-manual-unit-2t.png',
            '/images/products/hoist/hoist-manual-chain.png',
            '/images/products/hoist/hoist-manual-case.png'
          ]
        } else if (noVal === '7') {
          // 8CH Flight Case Group Controller (2 pictures)
          productImage = '/images/products/hoist/hoist-controller-panel.png'
          productImages = [
            '/images/products/hoist/hoist-controller-panel.png',
            '/images/products/hoist/hoist-controller-remote.png'
          ]
        } else if (noVal === '8') {
          productImage = '/images/products/hoist/hoist-main-cable.png'
          productImages = ['/images/products/hoist/hoist-main-cable.png']
        } else if (noVal === '9') {
          productImage = '/images/products/hoist/hoist-motor-cable.png'
          productImages = ['/images/products/hoist/hoist-motor-cable.png']
        } else if (noVal === '10') {
          productImage = '/images/products/hoist/hoist-shackle.png'
          productImages = ['/images/products/hoist/hoist-shackle.png']
        } else if (noVal === '11') {
          productImage = '/images/products/hoist/hoist-round-sling.png'
          productImages = ['/images/products/hoist/hoist-round-sling.png']
        } else if (noVal === '12') {
          productImage = '/images/products/hoist/hoist-router.png'
          productImages = ['/images/products/hoist/hoist-router.png']
        } else if (noVal === '13') {
          productImage = '/images/products/hoist/hoist-spare-battery.png'
          productImages = ['/images/products/hoist/hoist-spare-battery.png']
        }

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model,
          type: typeBadge,
          description: desc,
          price,
          priceFormatted: formatRupiah(price),
          sku: `HOIST-MD-${noVal}`,
          image: productImage,
          images: productImages.length > 0 ? productImages : undefined,
          brochureUrl: (link && (link.startsWith('http://') || link.startsWith('https://'))) ? link : (HOIST_LINKS[noVal] || undefined),
          metadata: {
            specLines: lines,
            capacity: cap,
            liftingHeight: height,
            images: productImages,
            videoUrl: link,
            no: seq
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
      let seq = 0
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        const item = r[2]?.trim().replace(/\n+/g, ' ') || ''
        if (!item) continue
        seq++
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
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model: item,
          type: typeBadge,
          description: spec || item,
          price,
          priceFormatted: formatRupiah(price),
          sku: `MRL-LT-${noVal || seq}`,
          image: `/images/products/meanreal/meanreal_item_${noVal || seq}.png`,
          brochureUrl: (link && (link.startsWith('http://') || link.startsWith('https://'))) ? link : (Object.entries(MEANREAL_LINKS).find(([k]) => item.toLowerCase().includes(k))?.[1] || undefined),
          metadata: {
            specification: spec,
            videoUrl: link,
            no: seq
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 7. MVG: Alumino
    // ==========================================
    case 'mvg_alumino': {
      let currItem = '300x300mm Bolt Truss'
      let currDesc = 'Material: aluminum 6082-T6'
      let isFullBrace = false
      let seq = 0
      let startIdx = 3
      for (let i = 0; i < rows.length; i++) {
        const rowStr = (rows[i] || []).join(' ').toLowerCase()
        if (rowStr.includes('item') && rowStr.includes('unit price')) {
          startIdx = i + 1
          break
        }
      }
      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const rawLine = (r.join(' ')).toLowerCase()
        if (rawLine.includes('bolt truss full brace')) {
          isFullBrace = true
        }

        const itemRaw = r[0]?.trim().replace(/\n+/g, ' ') || ''
        const descRaw = r[2]?.trim() || ''
        if (itemRaw) currItem = itemRaw
        if (descRaw) currDesc = descRaw
        const size = r[3]?.trim().replace(/\n+/g, ' ') || ''
        const price = parsePrice(r[5])
        if (price === 0 && !size) continue
        seq++

        let model = currItem
        if (isFullBrace && !model.toLowerCase().includes('full brace') && model.toLowerCase().includes('truss')) {
          model = `${model} (Full Brace)`
        }
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

        let productImage = '/images/products/alumino/alumino-truss-300.png'
        if (lower.includes('300x300') || lower.includes('300*300')) {
          if (lower.includes('box connector')) productImage = '/images/products/alumino/alumino-box-6way-300.png'
          else if (lower.includes('sleeve')) productImage = '/images/products/alumino/alumino-sleeve-300-450.png'
          else productImage = '/images/products/alumino/alumino-truss-300.png'
        } else if (lower.includes('400x400') || lower.includes('400*400')) {
          if (lower.includes('sleeve')) productImage = '/images/products/alumino/alumino-sleeve-600-400.png'
          else productImage = '/images/products/alumino/alumino-truss-400.png'
        } else if (lower.includes('450x450') || lower.includes('450*450')) {
          if (lower.includes('box connector')) productImage = '/images/products/alumino/alumino-box-6way-450.png'
          else productImage = '/images/products/alumino/alumino-truss-450.png'
        } else if (lower.includes('600x760') || lower.includes('600*760')) {
          if (lower.includes('box connector')) productImage = '/images/products/alumino/alumino-box-4way-600.png'
          else productImage = '/images/products/alumino/alumino-truss-600x760.png'
        } else if (lower.includes('600x1000') || lower.includes('600*1000')) {
          productImage = '/images/products/alumino/alumino-truss-600x1000.png'
        } else if (lower.includes('800x1000') || lower.includes('800*1000')) {
          productImage = '/images/products/alumino/alumino-truss-800x1000.png'
        } else if (lower.includes('top section')) {
          productImage = '/images/products/alumino/alumino-top-section.png'
        } else if (lower.includes('support brace')) {
          productImage = '/images/products/alumino/alumino-support-brace.png'
        } else if (lower.includes('clamp')) {
          productImage = '/images/products/alumino/alumino-double-clamps.png'
        } else if (lower.includes('ringlock') || lower.includes('scaffolding')) {
          if (lower.includes('horizontal')) productImage = '/images/products/alumino/alumino-ringlock-horizontal.png'
          else if (lower.includes('diagonal')) productImage = '/images/products/alumino/alumino-ringlock-diagonal.png'
          else if (lower.includes('base') || lower.includes('basement')) productImage = '/images/products/alumino/alumino-ringlock-base.png'
          else if (lower.includes('ladder')) productImage = '/images/products/alumino/alumino-ladder.png'
          else if (lower.includes('panel')) productImage = '/images/products/alumino/alumino-panel.png'
          else productImage = '/images/products/alumino/alumino-ringlock-pillar.png'
        } else if (lower.includes('trolley')) {
          productImage = '/images/products/alumino/alumino-trolley.png'
        } else if (lower.includes('roofing') || lower.includes('roof')) {
          if (lower.includes('down')) productImage = '/images/products/alumino/alumino-roofing-down.png'
          else if (lower.includes('fixable')) productImage = '/images/products/alumino/alumino-roofing-fixable.png'
          else productImage = '/images/products/alumino/alumino-roofing-corner.png'
        } else if (lower.includes('truss stand')) {
          productImage = '/images/products/alumino/alumino-truss-stand.png'
        } else if (lower.includes('stair')) {
          productImage = '/images/products/alumino/alumino-stage-stair.png'
        } else if (lower.includes('board')) {
          productImage = '/images/products/alumino/alumino-stage-board.png'
        } else if (lower.includes('stage stand')) {
          productImage = '/images/products/alumino/alumino-stage-stand.png'
        } else if (lower.includes('stage brace')) {
          productImage = '/images/products/alumino/alumino-stage-brace.png'
        } else if (lower.includes('stage base')) {
          productImage = '/images/products/alumino/alumino-stage-base.png'
        } else if (lower.includes('barrier') || lower.includes('mojo')) {
          if (lower.includes('corner')) productImage = '/images/products/alumino/alumino-barrier-corner.png'
          else if (lower.includes('door')) productImage = '/images/products/alumino/alumino-barrier-door.png'
          else productImage = '/images/products/alumino/alumino-barrier-straight.png'
        }

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model,
          type: typeBadge,
          description: currDesc || currItem,
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku: `ALU-TR-${seq}`,
          image: productImage,
          metadata: {
            size,
            material: currDesc,
            no: seq
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
      let seq = 1
      const paketPrice = parsePrice('Rp5.240.000')
      items.push({
        id: `${categoryId}-paket`,
        no: seq,
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
        image: '/images/products/ringlock/ringlock-structure-diagram.png',
        metadata: {
          isPaket: true,
          no: seq
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
        seq++

        const lower = name.toLowerCase()
        let productImage = '/images/products/ringlock/ringlock-vertical-standard.png'
        if (lower.includes('vertical')) {
          productImage = '/images/products/ringlock/ringlock-vertical-standard.png'
        } else if (lower.includes('horisontal') || lower.includes('horizontal')) {
          productImage = '/images/products/ringlock/ringlock-horizontal-ledger.png'
        } else if (lower.includes('diagonal')) {
          productImage = '/images/products/ringlock/ringlock-diagonal-brace.png'
        } else if (lower.includes('jack')) {
          productImage = '/images/products/ringlock/ringlock-jack-base.png'
        } else {
          productImage = '/images/products/ringlock/ringlock-structure-diagram.png'
        }

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model: name,
          type: 'Eceran Part',
          description: spec || name,
          price,
          priceFormatted: formatRupiah(price),
          sku: `RNG-PART-${seq}`,
          image: productImage,
          metadata: {
            specification: spec,
            no: seq
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
      let seq = 0
      for (let i = 5; i < rows.length; i++) {
        const r = rows[i]
        if (!r || !r.length) continue
        const noVal = r[0]?.trim() || ''
        if (!/^\d+$/.test(noVal)) continue
        seq++
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

        const GAGA_IMG_MAP: Record<string, string> = {
          '1': '/images/products/gaga/gaga-rgb-3w.png',
          '2': '/images/products/gaga/gaga-mini-rgb-4w.png',
          '3': '/images/products/gaga/gaga-rgb-5w.png',
          '4': '/images/products/gaga/gaga-mini-rgb-6w.png',
          '5': '/images/products/gaga/gaga-rgb-10w.png',
          '6': '/images/products/gaga/gaga-waterproof-20w.png',
          '7': '/images/products/gaga/gaga-waterproof-30w.png',
          '8': '/images/products/gaga/gaga-waterproof-40w.png',
          '9': '/images/products/gaga/gaga-pangolin-fb3.png',
          '10': '/images/products/gaga/gaga-pangolin-fb4.png'
        }
        const productImage = GAGA_IMG_MAP[noVal] || '/images/products/gaga/gaga-rgb-3w.png'

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model: title,
          type: typeBadge,
          description: spec || title,
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku: `GAG-LSR-${noVal}`,
          image: productImage,
          brochureUrl: (video && (video.startsWith('http://') || video.startsWith('https://'))) ? video : (GAGA_LINKS[noVal] || undefined),
          videoUrl: (video && (video.startsWith('http://') || video.startsWith('https://'))) ? video : (GAGA_LINKS[noVal] || undefined),
          metadata: {
            weight,
            size,
            specification: spec,
            videoSample: video,
            no: seq
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
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4) continue
        const name = r[1]?.trim().replace(/\n+/g, ' ') || ''
        const spec = r[2]?.trim() || ''
        const price = parsePrice(r[3])
        if (!name || price === 0) continue
        seq++

        let typeBadge = 'Straight Gate'
        if (name.toLowerCase().includes('corner')) typeBadge = 'Corner Gate'
        else if (name.toLowerCase().includes('door')) typeBadge = 'Door Gate'
        else if (name.toLowerCase().includes('wire')) typeBadge = 'Wire Slot'

        let productImage = '/images/products/mojo/mojo-gate-straight.png'
        const lowerName = name.toLowerCase()
        if (lowerName.includes('wire')) {
          productImage = '/images/products/mojo/mojo-gate-wire-slot.png'
        } else if (lowerName.includes('corner')) {
          productImage = '/images/products/mojo/mojo-gate-corner.png'
        } else if (lowerName.includes('door')) {
          productImage = '/images/products/mojo/mojo-gate-door.png'
        }

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model: name,
          type: typeBadge,
          description: spec || name,
          price,
          priceFormatted: formatRupiah(price),
          sku: `MOJO-BAR-${seq}`,
          image: productImage,
          metadata: {
            specification: spec,
            no: seq
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
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4) continue
        const noVal = r[0]?.trim() || ''
        const name = r[1]?.trim().replace(/\n+/g, ' ') || ''
        const price = parsePrice(r[3])
        const desc = r[4]?.trim() || ''
        if (!name || price === 0) continue
        seq++

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
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model: name,
          type: typeBadge,
          description: desc || name,
          price,
          priceFormatted: formatRupiah(price),
          sku: `ACC-RNT-${noVal || seq}`,
          image: `/images/products/aksesoris/acc_item_${noVal || seq}.png`,
          metadata: {
            specification: desc,
            no: seq
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 12. MVG: Instalasi LED Videotron (Modular & Cabinet)
    // ==========================================
    case 'mvg_instalasi_led': {
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 2) continue
        const rawGroup = (r[0] || '').trim() // e.g. "Qiangli Indoor", "Qiangli Outdoor", "ABSEN Indoor"
        const rawType = (r[1] || '').trim()  // e.g. "Qiangli P4 Pro", "Qiangli P10", "ABSEN CPS P2.5 Indoor"
        if (!rawGroup && !rawType) continue

        const modularStr = (r[2] || '').trim()
        const cabinetStr = (r[3] || '').trim()

        const hargaModular = parsePrice(modularStr)
        const hargaCabinet = parsePrice(cabinetStr)

        const primaryPrice = hargaCabinet > 0 ? hargaCabinet : hargaModular
        if (primaryPrice <= 0) continue

        seq++

        // Distinct, clean product name derived from TIPE + Group (Indoor/Outdoor)
        const isOutdoor = rawGroup.toLowerCase().includes('outdoor')
        const isIndoor = rawGroup.toLowerCase().includes('indoor')
        const lowerType = rawType.toLowerCase()

        let modelTitle = rawType
        if (!lowerType.includes('indoor') && !lowerType.includes('outdoor')) {
          if (isOutdoor) {
            modelTitle = `${rawType} Outdoor`
          } else if (isIndoor) {
            modelTitle = `${rawType} Indoor`
          }
        }

        // Determine representative product image
        let itemImg = '/images/products/qiangli-new-lite-indoor.png'
        if (rawGroup.toLowerCase().includes('outdoor')) {
          itemImg = '/images/products/qiangli-new-lite-outdoor.png'
        } else if (rawType.toLowerCase().includes('flexible')) {
          itemImg = '/images/products/av-qiangli-module.svg'
        } else if (rawGroup.toLowerCase().includes('absen') || rawType.toLowerCase().includes('absen')) {
          itemImg = '/images/products/av-cabinet-diecast.svg'
        } else if (rawType.toLowerCase().includes('cob')) {
          itemImg = '/images/products/qiangli-saga-indoor.png'
        }

        // Generate clean and recognizable SKU
        const cleanSkuCode = modelTitle
          .toUpperCase()
          .replace(/QIANGLI/g, 'QL')
          .replace(/[^A-Z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
        const sku = `INST-${cleanSkuCode}`

        const desc = `Paket Instalasi LED Videotron ${modelTitle} (Modular & Cabinet)`

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'mvg',
          model: modelTitle,
          type: rawGroup,
          description: desc,
          price: primaryPrice,
          priceFormatted: formatRupiah(primaryPrice),
          sku,
          image: itemImg,
          metadata: {
            no: seq,
            model: modelTitle,
            rawModel: rawGroup,
            type: rawGroup,
            rawType,
            hargaModular: hargaModular > 0 ? hargaModular : null,
            hargaModularFormatted: hargaModular > 0 ? formatRupiah(hargaModular) : '-',
            hargaCabinet: hargaCabinet > 0 ? hargaCabinet : null,
            hargaCabinetFormatted: hargaCabinet > 0 ? formatRupiah(hargaCabinet) : '-',
            specification: `Modular: ${hargaModular > 0 ? formatRupiah(hargaModular) : '-'} • Cabinet: ${hargaCabinet > 0 ? formatRupiah(hargaCabinet) : '-'}`,
            hargaCash: primaryPrice
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
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || !r[2]) continue
        const rawModel = r[0]?.trim() || ''
        const type = r[1]?.trim() || ''
        const desc = r[2]?.trim() || ''
        const size = r[3]?.trim() || ''
        const price = parsePrice(r[4])
        const refresh = r[5]?.trim() || ''
        const sku = r[6]?.trim() || `${categoryId}-${i}`
        seq++

        let actualModel = desc || rawModel
        const lowerDesc = actualModel.toLowerCase()
        const lowerType = type.toLowerCase()
        if (lowerType && !lowerDesc.includes(lowerType)) {
          actualModel = `${actualModel} ${type}`
        }
        const actualDesc = rawModel && rawModel !== actualModel
          ? `${rawModel} ${type ? '• ' + type : ''}`.trim()
          : (type ? `Modul LED ${type}` : 'Modul LED')

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: actualModel,
          type,
          description: actualDesc,
          size,
          refreshRate: refresh,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image:
            categoryId === 'qiangli'
              ? '/images/products/av-qiangli-module.svg'
              : '/images/products/av-lampro-module.svg',
          metadata: {
            no: seq
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 11. AV: Huidu
    // ==========================================
    case 'huidu': {
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || !r[1]) continue
        const brand = r[0]?.trim() || 'Huidu'
        const productName = r[1]?.trim() || ''
        const rawSpecs = r[2]?.trim() || ''
        const subCat = r[3]?.trim() || 'Multimedia Player'
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `${categoryId}-${i}`
        seq++

        const actualModel = productName || `${brand} ${sku}`
        const actualDesc = rawSpecs || `${brand} ${subCat}`

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: actualModel,
          type: subCat,
          description: actualDesc,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: '/images/products/av-huidu-controller.svg',
          metadata: {
            rawSpecs,
            no: seq
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
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || (!r[1] && !r[2])) continue
        const brand = r[0]?.trim() || 'Colorlight'
        const rawType = r[1]?.trim() || ''
        const rawDesc = r[2]?.trim() || ''
        const rawPrice = r[4]?.trim() || ''
        const price = parsePrice(rawPrice)
        const priceFormatted = price > 0 ? formatRupiah(price) : (rawPrice || 'Hubungi Sales')
        const sku = r[5]?.trim() || `${categoryId}-${i}`
        seq++

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
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: displayModel,
          type: displayType,
          description: `${brand} ${rawType} ${rawDesc}`.trim(),
          price,
          priceFormatted,
          sku,
          image: '/images/products/av-colorlight-controller.svg',
          metadata: {
            rawPrice,
            isDiscontinued: rawPrice.toLowerCase().includes('discontinued'),
            isCustom: rawPrice.toLowerCase().includes('custom'),
            no: seq
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 13. AV: Novastar
    // ==========================================
    case 'novastar': {
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || (!r[1] && !r[2])) continue

        // Check if row matches the new multi-column format with SKU ERP, SKU, HPP, Cash Price
        const hasNewFormat = r.length >= 16 && (r[13] || r[15])
        let brand = r[0]?.trim() || 'Novastar'
        let rawType = r[1]?.trim() || ''
        let rawDesc = r[2]?.trim() || ''
        let price = 0
        let hpp = 0
        let profit = ''
        let sku = ''
        let skuErp = ''
        let skuBiasa = ''

        if (hasNewFormat) {
          price = parsePrice(r[15])
          hpp = parsePrice(r[13])
          profit = r[14]?.trim() || ''
          skuErp = r[4]?.trim() || ''
          skuBiasa = r[5]?.trim() || ''

          if (!price || price === 0) continue
          if (rawType.toUpperCase().includes('MODEL') || rawDesc.toUpperCase().includes('DESCRIPTION')) continue

          sku = (skuErp && !skuErp.toUpperCase().includes('BELUM ADA') && skuErp !== '-')
            ? skuErp
            : (skuBiasa || `${categoryId}-${i}`)
        } else {
          price = parsePrice(r[4])
          if (!price || price === 0) continue
          if (rawType === '0' || rawDesc === '0') continue
          sku = r[5]?.trim() || `${categoryId}-${i}`
        }

        seq++

        const isGenericDesc =
          rawDesc.toLowerCase() === 'receiving card' ||
          rawDesc.toLowerCase() === 'video processor' ||
          rawDesc.toLowerCase() === 'multimedia player' ||
          rawDesc.toLowerCase() === 'controller' ||
          rawDesc.toLowerCase() === 'sending card' ||
          rawDesc.toLowerCase() === 'h series i/o card' ||
          rawDesc.toLowerCase() === 'all-in-one controller' ||
          rawDesc.toLowerCase() === 'fiber converter' ||
          rawDesc.toLowerCase() === 'lcd controller'

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
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: displayModel,
          type: displayType,
          description: `${brand} ${rawType} ${rawDesc}`.trim(),
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: '/images/products/av-novastar-controller.svg',
          metadata: {
            no: seq,
            skuErp: skuErp || undefined,
            skuBiasa: skuBiasa || undefined,
            capitalHpp: hpp || undefined,
            profitPercent: profit || undefined,
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 14. AV: Cabinet
    // ==========================================
    case 'cabinet': {
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4 || !r[0]?.trim()) continue
        const rawModel = (r[0]?.trim() || 'Cabinet').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ')
        const rawSize = r[1]?.trim() || (rawModel.toLowerCase().includes('vacuum') ? 'Wireless' : '')
        const cleanSize = rawSize.replace(/^\(+|\)+$/g, '').trim()
        const desc = (r[2]?.trim() || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ')
        const price = parsePrice(r[3])
        const sku = r[4]?.trim() || `${categoryId}-${i}`
        if (!price && !sku) continue
        seq++

        // Categorize Type
        let type = 'Cabinet'
        const lowerModel = rawModel.toLowerCase()
        if (lowerModel.includes('iron')) type = 'Iron'
        else if (lowerModel.includes('die-cast') || lowerModel.includes('diecast')) type = 'Die-cast'
        else if (lowerModel.includes('poster')) type = 'Poster'
        else if (lowerModel.includes('cube')) type = 'Cube'
        else if (lowerModel.includes('sign')) type = 'Sign'
        else if (lowerModel.includes('vacuum')) type = 'Tools'

        // Map specific graphic per cabinet type
        let cabinetImg = '/images/products/av-cabinet-iron.svg'
        if (type === 'Die-cast') cabinetImg = '/images/products/av-cabinet-diecast.svg'
        else if (type === 'Poster' || type === 'Sign') cabinetImg = '/images/products/av-cabinet-poster.svg'
        else if (type === 'Cube') cabinetImg = '/images/products/av-cabinet-cube.svg'
        else if (type === 'Tools') cabinetImg = '/images/products/av-cabinet-tools.svg'
        else cabinetImg = '/images/products/av-cabinet-iron.svg'

        const displayModel = cleanSize ? `${rawModel} (${cleanSize})` : rawModel
        const displayDesc = rawModel

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: displayModel,
          type,
          description: displayDesc,
          size: rawSize,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: cabinetImg,
          metadata: {
            no: seq,
            specification: desc && desc !== '-' ? desc : undefined
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 15. AV: PSU
    // ==========================================
    case 'psu': {
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 6 || !r[0]) continue
        const model = (r[0]?.trim() || 'PSU').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ')
        const type = r[1]?.trim() || ''
        const desc = r[3]?.trim() || ''
        const watt = r[1]?.trim() || ''
        const price = parsePrice(r[5])
        const sku = r[6]?.trim() || `${categoryId}-${i}`
        seq++

        const fullName = desc ? `${model} ${type} (${desc})`.trim() : `${model} ${type}`.trim()

        // Map physical images extracted from the official spreadsheet
        let psuImg = '/images/products/psu/psu-lampro-200w.png'
        const skuUpper = sku.toUpperCase()
        if (skuUpper.includes('LAM-LD200')) psuImg = '/images/products/psu/psu-lampro-200w.png'
        else if (skuUpper.includes('LAM-LD300')) psuImg = '/images/products/psu/psu-lampro-300w.png'
        else if (skuUpper.includes('LEY-LYD-200') || skuUpper.includes('LEY-200')) psuImg = '/images/products/psu/psu-leyard-200w.png'
        else if (skuUpper.includes('LEY-LYD-H300') || skuUpper.includes('LEY-H300')) psuImg = '/images/products/psu/psu-leyard-300w.png'
        else if (skuUpper.includes('CZCL')) psuImg = '/images/products/psu/psu-czcl-200w.png'
        else if (skuUpper.includes('CL-AS15') || (model.includes('Indoor 500mm') && model.includes('ChengLian'))) psuImg = '/images/products/psu/psu-chenglian-200w.png'
        else if (skuUpper.includes('CL-PAS6-H400') || (model.includes('Indoor 1000mm') && model.includes('ChengLian'))) psuImg = '/images/products/psu/psu-chenglian-400w.png'
        else if (skuUpper.includes('CL-PAS6-H500') || (model.includes('Outdoor 1000mm') && model.includes('ChengLian'))) psuImg = '/images/products/psu/psu-chenglian-500w.png'
        else if (skuUpper.includes('SC-NDC300') || model.includes('South Creative')) psuImg = '/images/products/psu/psu-southcreative-300w.png'
        else {
          const fallbackMap: Record<number, string> = {
            1: '/images/products/psu/psu-lampro-200w.png',
            2: '/images/products/psu/psu-lampro-300w.png',
            3: '/images/products/psu/psu-leyard-200w.png',
            4: '/images/products/psu/psu-leyard-300w.png',
            5: '/images/products/psu/psu-czcl-200w.png',
            6: '/images/products/psu/psu-chenglian-200w.png',
            7: '/images/products/psu/psu-chenglian-400w.png',
            8: '/images/products/psu/psu-chenglian-500w.png',
            9: '/images/products/psu/psu-southcreative-300w.png'
          }
          psuImg = fallbackMap[seq] || '/images/products/psu/psu-lampro-200w.png'
        }

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: fullName,
          type,
          description: fullName,
          size: watt,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: psuImg,
          metadata: {
            no: seq,
            watt,
            specification: desc
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 16. AV: LED Poster
    // ==========================================
    case 'led_poster': {
      let seq = 0
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 18 || !r[0]?.trim()) continue
        const brand = (r[0]?.trim() || 'LED Poster').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ')
        
        const moduleUnitPrice = parsePrice(r[2])
        const modulePcs = parseInt(r[3]) || 24
        const moduleTotalPrice = moduleUnitPrice * modulePcs

        const cabinetFlatCost = parsePrice(r[4])
        const cabinetFoldableCost = parsePrice(r[5])

        const psuPcs = parseInt(r[6]) || 4
        const psuUnitPrice = parsePrice(r[7])
        const psuTotalPrice = psuPcs * psuUnitPrice

        const rcPcs = parseInt(r[8]) || 2
        const rcUnitPrice = parsePrice(r[9])
        const rcTotalPrice = rcPcs * rcUnitPrice

        const cablesJumper = parsePrice(r[10]) || 200000
        const cablesPower = parsePrice(r[11]) || 150000
        const cablesTotal = cablesJumper + cablesPower

        const assemblyCost = parsePrice(r[12]) || 270000
        const processorA35Cost = parsePrice(r[13]) || 1786423
        const profitMargin = r[14]?.trim() || '25.00%'

        const priceFlat = parsePrice(r[15])
        const priceFoldable = parsePrice(r[16]) || priceFlat
        const size = r[17]?.trim() || '64x192cm'
        const sku = r[18]?.trim() || `QL-POSTER-${seq + 1}`
        const baseCost = parsePrice(r[19])

        if (!priceFlat || priceFlat <= 0) continue
        seq++

        let typeBadge = 'Indoor'
        const lowerBrand = brand.toLowerCase()
        if (lowerBrand.includes('outdoor')) typeBadge = 'Outdoor'
        else if (lowerBrand.includes('gob')) typeBadge = 'Indoor GOB'
        else typeBadge = 'Indoor'

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: brand,
          type: typeBadge,
          description: `LED Poster ${size} with A35 Player`,
          size,
          price: priceFlat,
          priceFormatted: formatRupiah(priceFlat),
          sku,
          image: '/images/products/av-led-poster.svg',
          metadata: {
            no: seq,
            priceFlat,
            priceFlatFormatted: formatRupiah(priceFlat),
            foldablePrice: priceFoldable,
            foldablePriceFormatted: formatRupiah(priceFoldable),
            moduleUnitPrice,
            modulePcs,
            moduleTotalPrice,
            modulePrice: moduleUnitPrice,
            cabinetFlatCost,
            cabinetFoldableCost,
            psuPcs,
            psuUnitPrice,
            psuTotalPrice,
            psuCost: psuUnitPrice,
            rcPcs,
            rcUnitPrice,
            rcTotalPrice,
            rcCost: rcUnitPrice,
            cablesJumper,
            cablesPower,
            cablesTotal,
            assemblyCost,
            processorA35Cost,
            processorCost: processorA35Cost,
            profitMargin,
            profit: profitMargin,
            baseCost
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 17. AV: LED Cube
    // ==========================================
    case 'led_cube': {
      let seq = 0
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 18 || !r[0]?.trim()) continue
        const rawType = r[0]?.trim()
        const price4Side = parsePrice(r[16])
        if (price4Side <= 0) continue
        const price5Side = parsePrice(r[17]) || price4Side
        const size = r[18]?.trim() || '32x32x32cm'
        const sku = `LED-CUBE-${rawType.replace(/\s+/g, '-').toUpperCase()}`
        seq++

        const isOutdoor = rawType.toLowerCase().includes('outdoor')
        const typeBadge = isOutdoor ? 'Outdoor' : 'Indoor'
        const actualModel = `LED Cube ${size} - ${rawType}`

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: actualModel,
          type: typeBadge,
          description: `Custom 4/5 Sisi Cube (${rawType})`,
          size,
          price: price4Side,
          priceFormatted: formatRupiah(price4Side),
          sku,
          image: '/images/products/av-led-cube.svg',
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
            processorCost: parsePrice(r[14]),
            no: seq
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
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 6 || !r[3]) continue
        const rawBrand = r[1]?.trim() || 'TKDN MAGNUSTEK'
        const locationType = r[2]?.trim() || '' // Indoor / Outdoor
        const rawModel = r[3]?.trim() || ''     // e.g. "Magnustek TKDN P0.9 COB", "Magnustek TKDN P1.2"
        const tkdnValue = r[4]?.trim() || ''
        const price = parsePrice(r[5])
        const paket = r[6]?.trim() || ''        // Meter / Pcs
        const subType = r[7]?.trim() || ''      // Cabinet / Module
        const size = r[8]?.trim() || ''
        const refresh = r[9]?.trim() || ''
        const sku = r[10]?.trim() || `MAG-TKDN-${i}`
        seq++

        // Distinct, professional model title per item:
        // e.g. "Magnustek TKDN P0.9 COB Indoor (Cabinet)"
        //      "Magnustek TKDN P1.2 Indoor (Module)"
        //      "Magnustek TKDN P2 Outdoor (Module)"
        const formFactor = subType || (paket.toLowerCase().includes('meter') ? 'Cabinet' : 'Module')
        let modelTitle = rawModel
        const lowerModel = modelTitle.toLowerCase()
        const lowerLoc = locationType.toLowerCase()
        if (lowerLoc && !lowerModel.includes(lowerLoc)) {
          modelTitle = `${modelTitle} ${locationType}`
        }
        const lowerForm = formFactor.toLowerCase()
        if (lowerForm && !lowerModel.includes(lowerForm)) {
          modelTitle = `${modelTitle} (${formFactor})`
        }

        const desc = `LED Videotron ${modelTitle} • ${size} • ${refresh ? `${refresh}Hz` : '4200Hz'} • Sertifikat Resmi TKDN Kemenperin ${tkdnValue}`

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: modelTitle,
          type: `${locationType} (${formFactor})`,
          description: desc,
          size,
          refreshRate: refresh,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: '/images/products/av-magnustek-tkdn.svg',
          metadata: {
            tkdnValue,
            paket,
            subType: formFactor,
            rawModel,
            brand: rawBrand,
            locationType,
            specification: `${size} • ${refresh ? `${refresh}Hz` : '4200Hz'} • TKDN ${tkdnValue}`,
            hargaCash: price,
            no: seq
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }

    // ==========================================
    // 22. AV & MVG: Finished Cabinet
    // ==========================================
    case 'finished_cabinet':
    case 'mvg_finished_cabinet': {
      let seq = 0
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 4) continue
        const rawModel = (r[1] || '').trim()
        const cabType = (r[2] || '').trim()
        const price = parsePrice(r[3])
        const sku = (r[4] || '').trim() || `FC-${i}`
        if (!rawModel && !cabType) continue
        if (!price && !sku) continue

        seq++

        // Extract size e.g. "96x96 CM", "64x48 CM", "(32+64)x96 CM", "600x337.5 MM"
        const sizeMatch = cabType.match(/(?:\(?\d+(?:\+\d+)?\)?\s*x\s*\d+(?:\.\d+)?\s*(?:CM|MM|cm|mm))/i)
        const size = sizeMatch ? sizeMatch[0] : ''

        // Categorize Type
        let type = 'Diecast'
        const lowerCab = cabType.toLowerCase()
        const lowerModel = rawModel.toLowerCase()
        if (lowerCab.includes('corner')) {
          type = 'Iron Corner'
        } else if (lowerCab.includes('curve')) {
          type = 'Iron Curve'
        } else if (lowerCab.includes('cob') || lowerModel.includes('cob')) {
          type = 'COB Diecast'
        } else if (lowerModel.includes('transparent')) {
          type = 'Diecast Transparent'
        } else if (lowerCab.includes('die-cast') || lowerCab.includes('diecast')) {
          type = 'Diecast'
        } else if (lowerCab.includes('iron')) {
          type = 'Iron'
        }

        // Map Image
        let itemImg = '/images/products/av-cabinet-diecast.svg'
        if (type.includes('Iron')) {
          itemImg = '/images/products/av-cabinet-iron.svg'
        } else if (type === 'Diecast Transparent') {
          itemImg = '/images/products/qiangli-mavic-xt-transparant.png'
        } else if (type === 'COB Diecast') {
          itemImg = '/images/products/av-cabinet-diecast.svg'
        }

        const displayModel = cabType ? `${rawModel} - ${cabType}` : rawModel
        const desc = `${rawModel} (${cabType})`

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: categoryId.startsWith('mvg_') ? 'mvg' : 'av',
          model: displayModel,
          type,
          description: desc,
          size: size || cabType,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: itemImg,
          metadata: {
            no: seq,
            model: rawModel,
            cabinetType: cabType,
            specification: cabType,
            hargaCash: price
          },
          updatedAt: new Date().toISOString()
        })
      }
      break
    }
  }

  return items
}

async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = index++
      results[current] = await fn(items[current])
    }
  })
  await Promise.all(workers)
  return results
}

async function fetchWithRetry(url: string, retries = 3, timeoutMs = 15000): Promise<string> {
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
    const fetchCategoryRows = async () => {
      return mapConcurrent(SHEET_CATEGORIES, 5, async (cat) => {
        // Novastar: use daily Hermes processed snapshot unless force refresh is requested
        if (cat.id === 'novastar' && !force) {
          const snapshotCandidates = [
            path.resolve(process.cwd(), 'server/data/novastar_snapshot.json'),
            path.resolve(process.cwd(), '../data/novastar_snapshot.json'),
            '/home/hisekawa/mvg/mvg_pricelist/fe/server/data/novastar_snapshot.json',
            '/home/hisekawa/mvg/outputs/novastar_snapshot.json'
          ]
          for (const sp of snapshotCandidates) {
            try {
              if (fs.existsSync(sp)) {
                const snap = JSON.parse(fs.readFileSync(sp, 'utf8'))
                if (Array.isArray(snap.items) && snap.items.length > 0) {
                  return { catId: cat.id, items: snap.items, rawText: snap.updatedAt || 'snapshot' }
                }
              }
            } catch {}
          }
        }

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
    }

    const [results] = await Promise.all([
      fetchCategoryRows(),
      refreshErpStockMap()
    ])

    // Calculate composite hash
    const hash = crypto.createHash('md5')
    for (const r of results) {
      hash.update(r.rawText)
    }
    const newHash = hash.digest('hex')

    const hasPendingCandidates = Object.keys(pendingCandidates).length > 0

    if (newHash !== store.contentHash || force || hasPendingCandidates) {
      hasChanges = true
      store.contentHash = newHash

async function notifyFoxPricelistAnomaly(anomalies: any[]) {
  // Explicitly muted by admin instruction: do not dispatch urgent alert to WhatsApp
  console.log(`[NitroCircuitBreaker] 🔇 Fox anomaly alert is muted by admin (${anomalies?.length || 0} anomalies safely blocked).`)
  return

  if (!Array.isArray(anomalies) || anomalies.length === 0) return

  const nowWib = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  }).format(new Date())

  const lines = [
    '🚨 *[FOX AI URGENT ALERT — NITRO PRICELIST CIRCUIT BREAKER]*',
    '_Peringatan Keamanan Web Pricelist & MVG Bisnis_',
    '',
    `📅 *Waktu Deteksi:* ${nowWib} WIB`,
    '🛡️ *Status Tindakan:* 🛑 *CIRCUIT BREAKER AKTIF — HARGA SHEET DIBLOKIR*',
    '',
    `⚠️ Terdeteksi *${anomalies.length} item dengan perubahan harga tidak wajar* di Google Sheets (MVG/AV). Server Web Pricelist *MENOLAK* harga tersebut dan *MEMPERTAHANKAN HARGA LAMA*:`,
    '',
    '📋 *DAFTAR ITEM YANG DIBLOKIR SEMENTARA:*'
  ]

  const maxDisplay = 8
  for (let i = 0; i < Math.min(anomalies.length, maxDisplay); i++) {
    const a = anomalies[i]
    lines.push(`• *[${a.sku}]* _${a.model || a.category}_`)
    lines.push(`  ├─ 🏷️ Harga Aman : *Rp ${Number(a.oldPrice).toLocaleString('id-ID')}*`)
    lines.push(`  ├─ ⚠️ Harga Sheet : *Rp ${Number(a.sheetPrice).toLocaleString('id-ID')}*`)
    lines.push(`  └─ ❗ Indikasi : _${a.reason}_`)
    lines.push('')
  }

  if (anomalies.length > maxDisplay) {
    lines.push(`...dan *${anomalies.length - maxDisplay} item anomali lainnya*.`)
    lines.push('')
  }

  lines.push('🛠️ *LANGKAH TINDAK LANJUT TIM IT:*')
  lines.push('1. Periksa Google Sheets untuk kategori terkait.')
  lines.push('2. Harga di Web Pricelist & Bisnis tetap aman di harga lama.')
  lines.push('')
  lines.push('—\n_Fox AI Guardian • IT & Infrastructure Mitra Visual Group_')

  try {
    const { exec } = await import('node:child_process')
    const b64 = Buffer.from(lines.join('\n')).toString('base64')
    const cmd = `(docker exec -u hermes hermes-vps node /opt/data/scripts/whatsapp-bridge/send_fox_message.mjs --base64 ${b64} || sudo -n docker exec -u hermes hermes-vps node /opt/data/scripts/whatsapp-bridge/send_fox_message.mjs --base64 ${b64})`
    exec(cmd, (err) => {
      if (err) console.warn('[NitroCircuitBreaker] Failed to invoke Fox:', err.message)
    })
  } catch (e: any) {
    console.warn('[NitroCircuitBreaker] Fox invoke error:', e.message)
  }
}

      const globalAnomalies: any[] = []

      for (const r of results) {
        const previousCatItems = store.itemsByCategory[r.catId] || []
        const prevPriceMap = new Map<string, number>()
        for (const item of previousCatItems) {
          prevPriceMap.set(item.sku, item.price)
        }

        const enrichedItems = r.items.map((item) => {
          const oldPrice = prevPriceMap.get(item.sku) ?? store.previousPrices[item.sku]
          let isAnomaly = false
          let anomalyReason = ''
          let isStabilizedAndAdopted = false

          // Absolute hard invalid check: price must be a valid positive finite number and not Rp 1
          const isHardInvalid = !Number.isFinite(item.price) || item.price <= 0 || item.price === 1

          if (isHardInvalid) {
            isAnomaly = true
            anomalyReason = `Target price drops to zero, invalid or Rp 1 (Rp ${oldPrice?.toLocaleString('id-ID') || 0} -> Rp ${item.price})`
            if (pendingCandidates[item.sku]) {
              delete pendingCandidates[item.sku]
            }
          } else if (typeof oldPrice === 'number' && oldPrice > 0 && typeof item.price === 'number') {
            let isDrasticChange = false

            if (item.price < oldPrice) {
              const dropAmount = oldPrice - item.price
              const dropPercent = (dropAmount / oldPrice) * 100
              if (oldPrice >= 1000000 && dropPercent >= 5.0 && dropAmount >= 1000000) {
                isDrasticChange = true
                anomalyReason = `Drastic price drop: Rp ${oldPrice.toLocaleString('id-ID')} -> Rp ${item.price.toLocaleString('id-ID')} (-${dropPercent.toFixed(1)}%, -Rp ${dropAmount.toLocaleString('id-ID')})`
              } else if (oldPrice < 1000000 && dropPercent >= 10.0) {
                isDrasticChange = true
                anomalyReason = `Significant price drop: Rp ${oldPrice.toLocaleString('id-ID')} -> Rp ${item.price.toLocaleString('id-ID')} (-${dropPercent.toFixed(1)}%)`
              }
            } else if (item.price > oldPrice) {
              const surgeAmount = item.price - oldPrice
              const surgePercent = (surgeAmount / oldPrice) * 100
              if (surgePercent >= 50.0 && surgeAmount >= 5000000) {
                isDrasticChange = true
                anomalyReason = `Extreme price surge (possible extra 0 typo): Rp ${oldPrice.toLocaleString('id-ID')} -> Rp ${item.price.toLocaleString('id-ID')} (+${surgePercent.toFixed(1)}%, +Rp ${surgeAmount.toLocaleString('id-ID')})`
              }
            }

            if (isDrasticChange) {
              const nowTime = now.getTime()
              const cand = pendingCandidates[item.sku]

              if (!cand || cand.candidatePrice !== item.price) {
                // First observation of this new price deviation
                pendingCandidates[item.sku] = {
                  candidatePrice: item.price,
                  firstSeenAt: nowTime,
                  lastSeenAt: nowTime,
                  observations: 1
                }
                isAnomaly = true
              } else {
                // Same deviating price seen consecutively in sheet
                cand.lastSeenAt = nowTime
                cand.observations += 1
                const durationMs = nowTime - cand.firstSeenAt

                if (durationMs >= STABILIZATION_WINDOW_MS && cand.observations >= 2) {
                  // STABILIZED! Consistently displayed in spreadsheet for several minutes
                  isStabilizedAndAdopted = true
                  isAnomaly = false
                  delete pendingCandidates[item.sku]
                  stabilizedAdoptedSkus[item.sku] = item.price
                  saveStabilizedAdopted(stabilizedAdoptedSkus)
                  console.log(`[Nitro Circuit Breaker] ✅ STABILIZED & ADOPTED [${item.sku}] (${r.catId}): Sheet price Rp ${item.price.toLocaleString('id-ID')} stable for ${(durationMs / 60000).toFixed(1)} min (${cand.observations}x observations). Adopted as official baseline!`)
                  void promoteStabilizedPriceToErp(item.sku, item.price, item.metadata?.hargaKredit, item.metadata?.btPrice)
                } else {
                  // Still pending stabilization window
                  isAnomaly = true
                  const remSec = Math.max(0, Math.ceil((STABILIZATION_WINDOW_MS - durationMs) / 1000))
                  anomalyReason += ` [Stabilizing: ${cand.observations}x observed, ~${remSec}s remaining]`
                }
              }
            } else {
              // Not a drastic change or price restored: clean candidate
              if (pendingCandidates[item.sku]) {
                delete pendingCandidates[item.sku]
              }
            }
          }

          if (isAnomaly) {
            console.warn(`[Nitro Circuit Breaker] 🛑 BLOCKED ANOMALY [${item.sku}] (${r.catId}): ${anomalyReason}`)
            globalAnomalies.push({
              sku: item.sku,
              model: item.model || item.name,
              category: r.catId,
              oldPrice,
              sheetPrice: item.price,
              reason: anomalyReason
            })
            // RETAIN OLD PRICE! DO NOT PERMIT UNCONTROLLED DROP/SURGE WHILE STABILIZING
            item.price = oldPrice
            item.priceFormatted = formatRupiah(oldPrice)
            if (!item.metadata) item.metadata = {}
            item.metadata.isAnomalyBlocked = true
            item.metadata.blockedTargetPrice = item.price
            item.metadata.anomalyReason = anomalyReason
          } else {
            if (oldPrice !== undefined && oldPrice !== item.price) {
              item.previousPrice = oldPrice
            }
            store.previousPrices[item.sku] = item.price
          }

          // Check ERP Sync & Available Stock
          const skuErp = item.metadata?.skuErp
          const skuBiasa = item.metadata?.skuBiasa
          const stockInfo = erpStockMap[item.sku] ||
            (skuErp ? erpStockMap[skuErp] : undefined) ||
            (skuBiasa ? erpStockMap[skuBiasa] : undefined)

          if (stockInfo && stockInfo.is_synced) {
            item.isSynced = true
            item.availableStock = Number(stockInfo.available_stock || 0)
            item.erpItemId = stockInfo.m_items_id || stockInfo.id
            item.batches = Array.isArray(stockInfo.batches) ? stockInfo.batches : []

            // ERP Master Price Cross-Validation & Authority Enforcement:
            // For items synced with ERP, if sheet price deviates anomalously and HAS NOT STABILIZED,
            // retain ERP master price. BUT if it was stabilized and adopted from spreadsheet, allow it through!
            const isAlreadyStabilized = stabilizedAdoptedSkus[item.sku] === item.price
            if (!isStabilizedAndAdopted && !isAlreadyStabilized && stockInfo.harga_cash && Number(stockInfo.harga_cash) > 0) {
              const erpCash = Number(stockInfo.harga_cash)
              const erpKredit = stockInfo.harga_kredit ? Number(stockInfo.harga_kredit) : null
              const diffPercent = Math.abs((item.price - erpCash) / erpCash) * 100
              if (diffPercent >= 5.0 && Math.abs(item.price - erpCash) >= 1000000) {
                const nowTime = now.getTime()
                const erpKey = `erp_${item.sku}`
                const cand = pendingCandidates[erpKey]

                if (!cand || cand.candidatePrice !== item.price) {
                  pendingCandidates[erpKey] = {
                    candidatePrice: item.price,
                    firstSeenAt: nowTime,
                    lastSeenAt: nowTime,
                    observations: 1
                  }
                  console.warn(`[Nitro Circuit Breaker] 🛡️ Overriding sheet price for ${item.sku} with authoritative ERP price: Rp ${erpCash.toLocaleString('id-ID')} (sheet was Rp ${item.price.toLocaleString('id-ID')}). Waiting for sheet stabilization.`)
                  item.price = erpCash
                  item.priceFormatted = formatRupiah(erpCash)
                  if (item.metadata) {
                    item.metadata.hargaCash = erpCash
                    if (erpKredit) item.metadata.hargaKredit = erpKredit
                  }
                  store.previousPrices[item.sku] = erpCash
                } else {
                  cand.lastSeenAt = nowTime
                  cand.observations += 1
                  const durationMs = nowTime - cand.firstSeenAt

                  if (durationMs >= STABILIZATION_WINDOW_MS && cand.observations >= 2) {
                    delete pendingCandidates[erpKey]
                    stabilizedAdoptedSkus[item.sku] = item.price
                    saveStabilizedAdopted(stabilizedAdoptedSkus)
                    console.log(`[Nitro Circuit Breaker] ✅ ERP DEVIATION STABILIZED [${item.sku}]: Sheet consistently displayed Rp ${item.price.toLocaleString('id-ID')} for ${(durationMs / 60000).toFixed(1)} min. Promoting to web pricelist!`)
                    store.previousPrices[item.sku] = item.price
                    void promoteStabilizedPriceToErp(item.sku, item.price, item.metadata?.hargaKredit, item.metadata?.btPrice)
                  } else {
                    item.price = erpCash
                    item.priceFormatted = formatRupiah(erpCash)
                    if (item.metadata) {
                      item.metadata.hargaCash = erpCash
                      if (erpKredit) item.metadata.hargaKredit = erpKredit
                    }
                    store.previousPrices[item.sku] = erpCash
                  }
                }
              } else {
                if (pendingCandidates[`erp_${item.sku}`]) {
                  delete pendingCandidates[`erp_${item.sku}`]
                }
              }
            }
          } else {
            item.isSynced = false
            item.availableStock = 0
            item.erpItemId = undefined
            item.batches = []
          }

          if (!item.metadata) item.metadata = {}
          item.metadata.isStabilized = isStabilizedAndAdopted || (stabilizedAdoptedSkus[item.sku] === item.price)

          return item
        })

        store.itemsByCategory[r.catId] = enrichedItems
        updatedCategories.push(r.catId)
      }

      if (globalAnomalies.length > 0) {
        void notifyFoxPricelistAnomaly(globalAnomalies)
      }

      store.lastSync = now.toISOString()
      savePersistentBaseline(store.previousPrices)
      savePendingCandidates(pendingCandidates)
      saveStabilizedAdopted(stabilizedAdoptedSkus)

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

export function updateItemErpSyncStatus(sku: string, isSynced: boolean, availableStock: number, erpItemId?: string) {
  erpStockMap[sku] = {
    sku,
    is_synced: isSynced,
    available_stock: availableStock,
    m_items_id: erpItemId
  }

  // Update in memory items across all categories
  for (const catId of Object.keys(store.itemsByCategory)) {
    const list = store.itemsByCategory[catId] || []
    for (const item of list) {
      if (item.sku === sku) {
        item.isSynced = isSynced
        item.availableStock = availableStock
        if (erpItemId) item.erpItemId = erpItemId
      }
    }
  }

  // Broadcast update
  broadcastSSE('item_sync_updated', {
    sku,
    isSynced,
    availableStock,
    erpItemId,
    lastSync: new Date().toISOString()
  })
}

// Scheduled daily 05:00 AM WIB refresh for Web Pricelist.
// Hermes VPS processes the master sheets, runs anomaly checks, and synchronizes ERP & snapshot.
function scheduleNextDaily5AmPricelistRefresh() {
  const now = new Date()
  const wibOffset = 7 * 60
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const wibMinutes = (utcMinutes + wibOffset) % (24 * 60)
  const targetWibMinutes = 5 * 60 // 05:00 WIB

  let diffMinutes = targetWibMinutes - wibMinutes
  if (diffMinutes <= 0) {
    diffMinutes += 24 * 60
  }
  const delayMs = diffMinutes * 60 * 1000
  console.log(`[AutoSyncPoller] ⏰ Jadwal refresh harian pricelist berikutnya: dalam ${(delayMs / 3600000).toFixed(1)} jam (05:00 WIB)`)

  setTimeout(() => {
    console.log('[AutoSyncPoller] 🔔 Menjalankan refresh harian 05:00 WIB...')
    fetchAllSheets(true).catch(console.error)
    scheduleNextDaily5AmPricelistRefresh()
  }, delayMs)
}

let intervalStarted = false
export function startAutoSyncPoller() {
  if (intervalStarted) return
  intervalStarted = true

  // Initial warmup on server launch
  fetchAllSheets(false).catch(console.error)
  scheduleNextDaily5AmPricelistRefresh()
}
