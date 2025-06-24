import { v } from 'convex/values'
import { query } from './_generated/server'
import { Dispatches } from './schema'

export const getIncomingDispatch = query({
  args: {},
  handler: async (ctx) => {
    const dispatches = await ctx.db.query('incomingDispatches').collect()
    return dispatches.map((d) => {
      const { _id, _creationTime, ...dispatchData } = d
      return dispatchData
    })
  },
})

export const filterNewDispatches = query({
  args: {
    dispatches: v.array(v.object(Dispatches.withoutSystemFields)),
  },
  handler: async (ctx, args) => {
    const incomingDispatches = args.dispatches
    const existingDispatches = await ctx.db.query('dispatches').collect()
    return incomingDispatches.filter(
      (i) => !existingDispatches.some((d) => d.dispatchId === i.dispatchId)
    )
  },
})
