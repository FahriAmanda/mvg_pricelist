import { startAutoSyncPoller } from '../utils/sheets'

export default defineNitroPlugin(() => {
  // Starts initial warm-up fetch and recurring background stabilization observer poller
  startAutoSyncPoller()
})
