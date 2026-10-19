import type { PricelistItem } from '../../types/pricelist'
import { SHEET_CATEGORIES, parsePrice, formatRupiah } from './catalogSource'
export { SHEET_CATEGORIES, parsePrice, formatRupiah }

// Prices are read only from the approved DB snapshot. No timers or price writers.
const store = { itemsByCategory: {} as Record<string, PricelistItem[]>, categoryExtra: {} as Record<string, any>, lastSync: '', contentHash: '', isFetching: false, version: '', governance: {} as Record<string, any> }
let erpStockMap: Record<string, any> = {}
let erpWarehouses: Array<{ id: string; kode_gudang: string; nama_gudang: string }> = []
let lastStockFetch=0
let snapshotRequest: Promise<void> | null=null
const base = () => process.env.MVG_API_BASE || 'https://be-mvg.mitravisualgroup.com'

export async function fetchAllSheets(_force=false) {
  if (!snapshotRequest) snapshotRequest=(async()=>{
    const response=await fetch(`${base()}/api/marketing/pricelist-approved-snapshot`,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}})
    if(!response.ok) throw createError({statusCode:503,statusMessage:'Snapshot harga Hermes belum tersedia; tidak mengambil harga mentah.'})
    const data=await response.json()
    if(!data.version || !data.itemsByCategory || !Array.isArray(data.categories) || data.categories.length!==SHEET_CATEGORIES.length) throw createError({statusCode:503,statusMessage:'Snapshot harga tidak lengkap'})
    store.itemsByCategory=data.itemsByCategory
    store.categoryExtra=data.categoryExtra||{}
    store.lastSync=data.lastSync
    store.contentHash=data.hash
    store.version=data.version
    store.governance=data.governance||{}
    applyLiveStockToAllCategories()
  })().finally(()=>{snapshotRequest=null})
  await snapshotRequest
  return {success:true,updated:true,totalItems:Object.values(store.itemsByCategory).reduce((n,a)=>n+a.length,0),lastSync:store.lastSync}
}
export function getStoreState() { return store }
export function getCategoryItems(id:string) {return store.itemsByCategory[id]||[]}
export function getErpWarehouses() {return erpWarehouses}
export function applyLiveStockToAllCategories() {
  for(const items of Object.values(store.itemsByCategory)) for(const item of items) {
    const stock=erpStockMap[item.erpSku || item.sku] || erpStockMap[item.metadata?.skuErp as string] || erpStockMap[item.metadata?.skuBiasa as string]
    item.availableStock=stock?Number(stock.available_stock||0):0
    item.batches=Array.isArray(stock?.batches)?stock.batches:[]
    // Stock presence never overrides mapping or sale eligibility.
  }
}
export async function refreshErpStockMap(force=false) {
  if(!force&&Date.now()-lastStockFetch<10000) return erpStockMap
  try {
    const response=await fetch(`${base()}/api/marketing/pricelist-sync-stock`,{signal:AbortSignal.timeout(5000)})
    if(!response.ok) throw new Error(`Stock HTTP ${response.status}`)
    const data=await response.json()
    if(data.status!=='success') throw new Error('Stock unavailable')
    erpStockMap=data.data||{}
    erpWarehouses=data.warehouses||[]
    lastStockFetch=Date.now()
    applyLiveStockToAllCategories()
  } catch { /* Keep last known stock; never update prices. */ }
  return erpStockMap
}
export function updateItemErpSyncStatus(sku:string,isSynced:boolean,availableStock:number,erpItemId?:string) {
  erpStockMap[sku]={sku,is_synced:isSynced,available_stock:availableStock,m_items_id:erpItemId}
  applyLiveStockToAllCategories()
}
const sseClients=new Set<{id:string;send:(event:string,data:any)=>void}>()
export function registerSSEClient(client:{id:string;send:(event:string,data:any)=>void}) {
  sseClients.add(client);return ()=>sseClients.delete(client)
}
export function broadcastSSE(event:string,data:any) { for(const client of sseClients) {try{client.send(event,data)}catch{sseClients.delete(client)}} }
export function startAutoSyncPoller() { /* Hermes is the only publisher. */ }
