import { fetchAllSheets } from '../../utils/sheets'

export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  })

  const result = await fetchAllSheets(true)
  return {
    success: true,
    message: result.updated ? 'Data berhasil diperbarui dari Google Sheets' : 'Data sudah mutakhir',
    totalItems: result.totalItems,
    lastSync: result.lastSync
  }
})
