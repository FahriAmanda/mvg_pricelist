import { registerSSEClient, getStoreState } from '../../utils/sheets'

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')

  const res = event.node.res

  const clientId = `client-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const client = {
    id: clientId,
    send: (data: string) => {
      res.write(data)
    }
  }

  const unregister = registerSSEClient(client)

  // Send initial ping with state
  const store = getStoreState()
  client.send(`event: connected\ndata: ${JSON.stringify({ clientId, lastSync: store.lastSync, hash: store.contentHash })}\n\n`)

  // Heartbeat ping every 25 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n')
    } catch {
      clearInterval(heartbeat)
      unregister()
    }
  }, 25000)

  event.node.req.on('close', () => {
    clearInterval(heartbeat)
    unregister()
  })

  // Keep connection open in Nitro
  return new Promise(() => {})
})
