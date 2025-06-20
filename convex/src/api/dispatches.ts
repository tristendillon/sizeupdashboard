// convex/recipes.ts
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Dispatches } from './schema'
import { paginationOptsValidator } from 'convex/server'
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

export const createDispatch = mutation({
  args: Dispatches.withoutSystemFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert('dispatches', args)
  },
})

export const getDispatches = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .paginate(paginationOpts)
  },
})
