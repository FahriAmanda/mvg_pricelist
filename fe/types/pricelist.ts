export interface PricelistItem {
  id: string
  category: string
  catalog?: 'mvg' | 'av'
  no?: number
  model: string
  type: string
  description: string
  size?: string
  refreshRate?: string
  price: number
  priceFormatted: string
  sku: string
  image?: string
  images?: string[]
  brochureUrl?: string
  videoUrl?: string
  metadata?: Record<string, any>
  previousPrice?: number
  updatedAt?: string
}

export interface SheetCategory {
  id: string
  name: string
  catalog: 'mvg' | 'av'
  icon: string
  description: string
  itemCount: number
  lastUpdated: string
  bannerTitle?: string
  bannerSubtitle?: string
  bannerImage?: string
  kursUSD?: string
  notes?: string[]
  comparisonChart?: string
}

export interface SyncStatus {
  lastSync: string
  isSyncing: boolean
  hash: string
  totalProducts: number
}
