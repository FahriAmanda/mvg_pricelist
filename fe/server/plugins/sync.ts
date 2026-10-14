import { startAutoSyncPoller } from '../utils/sheets'

export default defineNitroPlugin(() => {
  // Start background auto-sync every 60s
  startAutoSyncPoller()
})
