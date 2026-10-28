export default defineEventHandler(() => { throw createError({ statusCode: 410, statusMessage: 'Raw price refresh retired. Hermes VPS publishes approved prices at 07:00 WIB.' }) })
