import { convexToZod } from 'convex-helpers/server/zod'
import { defineSchema } from 'convex/server'
import { v } from 'convex/values'
import { Table } from 'convex-helpers/server'
import type { Doc } from './_generated/dataModel'
import type { WithoutSystemFields } from 'convex/server'

export const IncomingDispatch = Table('incomingDispatches', {
  dispatchId: v.string(),
  type: v.string(),
  message: v.string(),
  address: v.string(),
  address2: v.string(),
  city: v.string(),
  stateCode: v.string(),
  latitude: v.string(),
  longitude: v.string(),
  unitCodes: v.array(v.string()),
  incidentTypeCode: v.string(),
  statusCode: v.string(),
  xrefId: v.string(),
  dispatchCreatedAt: v.string(),
})

export const IncomingDispatchSchema = convexToZod(
  IncomingDispatch.table.validator
)
export type IncomingDispatch = WithoutSystemFields<Doc<'incomingDispatches'>>

export const Dispatches = Table('dispatches', {
  dispatchId: v.string(),
  type: v.string(),
  message: v.string(),
  address: v.string(),
  address2: v.string(),
  city: v.string(),
  stateCode: v.string(),
  latitude: v.string(),
  longitude: v.string(),
  unitCodes: v.array(v.string()),
  incidentTypeCode: v.string(),
  statusCode: v.string(),
  xrefId: v.string(),
  dispatchCreatedAt: v.string(),
})
export const DispatchesSchema = convexToZod(Dispatches.table.validator)
export type PostDispatch = WithoutSystemFields<Doc<'dispatches'>>

export default defineSchema(
  {
    dispatches: Dispatches.table
      .index('by_dispatchId', ['dispatchId'])
      .index('by_dispatchCreatedAt', ['dispatchCreatedAt'])
      .index('by_xrefId', ['xrefId']),
    incomingDispatches: IncomingDispatch.table
      .index('by_dispatchId', ['dispatchId'])
      .index('by_dispatchCreatedAt', ['dispatchCreatedAt'])
      .index('by_xrefId', ['xrefId']),
  },
  // If you ever get an error about schema mismatch
  // between your data and your schema, and you cannot
  // change the schema to match the current data in your database,
  // you can:
  //  1. Use the dashboard to delete tables or individual documents
  //     that are causing the error.
  //  2. Change this option to `false` and make changes to the data
  //     freely, ignoring the schema. Don't forget to change back to `true`!
  { schemaValidation: true }
)
