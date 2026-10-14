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

export interface CategoryExtra {
  bannerTitle?: string
  bannerSubtitle?: string
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
    kursUSD: 'Rp18.062',
    notes: [
      '1. Harga sudah termasuk (Flightcase ABS, Cabling, Clamp dan sparepart 2%)',
      '2. Harga belum termasuk Video Prosesor Colorlight / Novastar',
      '3. Harga FOB pengiriman dari Jakarta dan Surabaya'
    ]
  },
  mvg_rental_maven: {
    bannerTitle: 'PRICE LIST PRODUK LED RENTAL /METER PERSEGI',
    bannerSubtitle: 'Katalog Resmi Unilumin Lampro Maven & LRS Rental Series MVG',
    kursUSD: 'Rp18.062',
    notes: [
      '1. Harga sudah termasuk (Flightcase ABS, Cabling, Clamp dan sparepart 2%)',
      '2. Harga belum termasuk Video Prosesor',
      '3. Harga FOB pengiriman dari Jakarta dan Surabaya'
    ]
  },
  mvg_moka_effect: {
    bannerTitle: 'MOKA SFX SPECIAL EFFECTS & STAGE ATMOSPHERE',
    bannerSubtitle: 'Katalog Efek Panggung CO2 Cannon, Double Jet, Cold Sparkle & Flame MVG',
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
    kursUSD: 'RoHS Compliant',
    notes: [
      '1. Power Distribution Panel 3-Phase dilengkapi MCB individual & digital meter',
      '2. Kabel PowerCON, Cat6 UTP, dan Fiber Optic standar RoHS compliant',
      '3. Flightcase ABS shockproof melindungi modul & kabinet saat mobilitas rental'
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
    kursUSD: '5V / 4.5V Output',
    notes: [
      '1. Power Supply efisiensi tinggi standar videotron 5V / 4.5V output stabil',
      '2. Proteksi lengkap: Overload, Short-Circuit, Over-Voltage & Thermal Cutoff',
      '3. Merk terpercaya: Lampro LD-series, Leyard, Meanwell & G-Energy 200W - 400W'
    ]
  },
  led_poster: {
    bannerTitle: 'LED POSTER DISPLAY FLAT & FOLDABLE SERIES',
    bannerSubtitle: 'Katalog LED Poster 640x1920mm Plug & Play Mobile Display AV & MVG',
    kursUSD: 'Include A35 Player',
    notes: [
      '1. Ukuran standar display 640 x 1920 mm dengan frame aluminium ultra-slim',
      '2. Tersedia model Flat (kaki roda mobile) dan Foldable (lipat portable)',
      '3. Sudah include Colorlight A35 Player, speaker terintegrasi & Wi-Fi control'
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
          const lower = (rawType + ' ' + desc).toLowerCase()
          if (lower.includes('alpha')) {
            productImage = '/images/products/fabulux-alpha.svg'
            brochureUrl = 'https://drive.google.com/file/d/1vZei59qgFOxooOqKxyGY6kKnwiguCK6S/view?usp=drive_link'
          } else if (lower.includes('spider')) {
            productImage = '/images/products/fabulux-spider-max.svg'
            brochureUrl = 'https://drive.google.com/file/d/1N2wMOUfsXdRHqwCj0kUMFcxE_fsSTr22/view?usp=drive_link'
          } else if (lower.includes('hanging') || lower.includes('base')) {
            productImage = '/images/products/fabulux-hanging-bar.svg'
          } else {
            productImage = '/images/products/fabulux-master-plus.svg'
            brochureUrl = 'https://drive.google.com/file/d/1ZZwDyEdpidGwDsyQMO9wL16DNelr_adH/view?usp=drive_link'
          }
        } else if (categoryId === 'mvg_rental_maven') {
          const lower = (rawType + ' ' + desc).toLowerCase()
          if (lower.includes('lrs')) {
            productImage = '/images/products/unilumin-lrs-p26.svg'
            brochureUrl = 'https://drive.google.com/file/d/1wnannEXIUkW3_7NoYR-JLaPST505yjpz/view?usp=drive_link'
          } else {
            productImage = '/images/products/maven-p39-outdoor.svg'
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
          description:
            desc ||
            `${brand} ${rawType} ${size ? 'Size: ' + size : ''} ${
              curve ? 'Curve: ' + curve : ''
            }`.trim(),
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
        seq++

        const lower = (title + ' ' + desc).toLowerCase()
        let productImage = '/images/products/moka-co2-cannon.svg'
        if (lower.includes('spark') || lower.includes('powder') || lower.includes('firework')) {
          productImage = '/images/products/moka-cold-spark.svg'
        }

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
          brochureUrl: (link && (link.startsWith('http://') || link.startsWith('https://'))) ? link : (HOIST_LINKS[noVal] || undefined),
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
      for (let i = 3; i < rows.length; i++) {
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

        const lower = model.toLowerCase()
        let productImage = '/images/products/hoist-electric-611.svg'
        if (
          lower.includes('controller') ||
          lower.includes('cable') ||
          lower.includes('shackle') ||
          lower.includes('sling') ||
          lower.includes('router') ||
          lower.includes('battery')
        ) {
          productImage = '/images/products/acc-power-distribution.svg'
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
          brochureUrl: (link && (link.startsWith('http://') || link.startsWith('https://'))) ? link : (HOIST_LINKS[noVal] || undefined),
          metadata: {
            specLines: lines,
            capacity: cap,
            liftingHeight: height,
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
      for (let i = 3; i < rows.length; i++) {
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
          image: '/images/products/meanreal-bsw-550.svg',
          brochureUrl: (link && (link.startsWith('http://') || link.startsWith('https://'))) ? link : (HOIST_LINKS[noVal] || undefined),
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
    // 5. MVG: Alumino
    // ==========================================
    case 'mvg_alumino': {
      let currItem = ''
      let currDesc = ''
      let seq = 0
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
        seq++

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
          image: '/images/products/alumino-bolt-truss.svg',
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
        image: '/images/products/ringlock-scaffolding.svg',
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
          image: '/images/products/ringlock-scaffolding.svg',
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
          image: '/images/products/gaga-laser-rgb.svg',
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
      for (let i = 2; i < rows.length; i++) {
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
          image: '/images/products/mojo-barrier.svg',
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
          image: '/images/products/acc-power-distribution.svg',
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
    // 10. AV: Qiangli / Lampro Module
    // ==========================================
    case 'qiangli':
    case 'lampro': {
      let seq = 0
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
        seq++

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
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

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: brand,
          type: subCat,
          description: productName,
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
        const price = parsePrice(r[4])
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
          priceFormatted: formatRupiah(price),
          sku,
          image: '/images/products/av-colorlight-controller.svg',
          metadata: {
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
        const brand = r[0]?.trim() || 'Novastar'
        const rawType = r[1]?.trim() || ''
        const rawDesc = r[2]?.trim() || ''
        const price = parsePrice(r[4])
        if (!price || price === 0) continue
        if (rawType === '0' || rawDesc === '0') continue
        const sku = r[5]?.trim() || `${categoryId}-${i}`
        seq++

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
            no: seq
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
        if (!r || r.length < 4 || !r[0]) continue
        const model = r[0]?.trim() || 'Cabinet'
        const type = r[1]?.trim() || ''
        const size = r[2]?.trim() || ''
        const price = parsePrice(r[3])
        const desc = r[4]?.trim() || ''
        const sku = r[5]?.trim() || `${categoryId}-${i}`
        seq++

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model,
          type,
          description: desc || `${type} ${size}`.trim(),
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: '/images/products/av-cabinet-diecast.svg',
          metadata: {
            no: seq
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
        const model = r[0]?.trim() || 'PSU'
        const type = r[1]?.trim() || ''
        const desc = r[3]?.trim() || ''
        const watt = r[1]?.trim() || ''
        const price = parsePrice(r[5])
        const sku = r[6]?.trim() || `${categoryId}-${i}`
        seq++

        const fullName = desc ? `${model} - ${desc}` : model

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model,
          type,
          description: fullName,
          size: watt,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: '/images/products/av-psu-meanwell.svg',
          metadata: {
            no: seq
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
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i]
        if (!r || r.length < 5 || !r[2]) continue
        const brand = r[0]?.trim() || 'LED Poster'
        const rawType = r[1]?.trim() || ''
        const size = r[2]?.trim() || ''
        const price = parsePrice(r[4])
        const sku = r[5]?.trim() || `${categoryId}-${i}`
        seq++

        let typeBadge = 'Foldable'
        if (rawType.toLowerCase().includes('flat')) typeBadge = 'Flat'
        else if (rawType.toLowerCase().includes('foldable')) typeBadge = 'Foldable'

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: brand,
          type: typeBadge,
          description: rawType || `${brand} ${size}`,
          size,
          price,
          priceFormatted: formatRupiah(price),
          sku,
          image: '/images/products/av-led-poster.svg',
          metadata: {
            no: seq
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
        const price5Side = parsePrice(r[17]) || price4Side
        const size = r[18]?.trim() || '32x32x32cm'
        const sku = `LED-CUBE-${rawType.replace(/\s+/g, '-').toUpperCase()}`
        seq++

        const isOutdoor = rawType.toLowerCase().includes('outdoor')
        const typeBadge = isOutdoor ? 'Outdoor' : 'Indoor'

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
          category: categoryId,
          catalog: 'av',
          model: 'LED Cube 32x32cm',
          type: typeBadge,
          description: rawType,
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
        seq++

        items.push({
          id: `${categoryId}-${seq}`,
          no: seq,
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
          image: '/images/products/av-magnustek-tkdn.svg',
          metadata: {
            tkdnValue,
            paket,
            subType,
            no: seq
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
