import { startAutoSyncPoller } from '../utils/sheets'

export default defineNitroPlugin(() => {
  // Cold start initialization only — NO recurring background poller to sheets.
  // All periodic synchronization is strictly orchestrated by Hermes VPS.
  startAutoSyncPoller()
})
