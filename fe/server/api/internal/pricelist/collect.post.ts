import crypto from 'node:crypto'
import { collectCatalogSources } from '../../../utils/catalogSource'
export default defineEventHandler(async event => {
  const actual = getHeader(event, 'x-hermes-pricelist-secret') || ''
  const expected = process.env.HERMES_PRICELIST_SECRET || ''
  const a=Buffer.from(actual), b=Buffer.from(expected)
  if(expected.length<32 || a.length!==b.length || !crypto.timingSafeEqual(a,b)) throw createError({statusCode:401,statusMessage:'Verified Hermes service credentials required'})
  setResponseHeader(event,'Cache-Control','no-store')
  return collectCatalogSources()
})
